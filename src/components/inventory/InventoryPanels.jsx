import { useMemo, useState } from 'react'
import { dateTime, expiryInfo, localDate, money, suggestedQuantity } from '../../services/inventoryCalculations'
import { Button, Dialog, Empty, Field, FormFooter } from './InventoryUI'

export function InventorySummaryCards({ items, onFilter }) {
  const batches = items.flatMap(i => i.batches).filter(b => b.remainingQuantity > 0)
  const cards = [
    ['Nguyên liệu đang theo dõi', items.filter(i => i.active).length, {}],
    ['Tổng giá trị tồn kho', money(items.reduce((s, i) => s + i.inventoryValue, 0)), { sort: 'value', active: 'all' }],
    ['Mặt hàng sắp hết', items.filter(i => i.active && i.status === 'LOW_STOCK').length, { status: 'LOW_STOCK' }],
    ['Mặt hàng đã hết', items.filter(i => i.active && i.status === 'OUT_OF_STOCK').length, { status: 'OUT_OF_STOCK' }],
    ['Lô hết hạn trong 7 ngày', batches.filter(b => expiryInfo(b.expiryDate).status === 'EXPIRING_SOON').length, { expiry: 'EXPIRING_SOON', active: 'all' }],
    ['Giá trị hàng hết hạn', money(batches.filter(b => expiryInfo(b.expiryDate).status === 'EXPIRED').reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0)), { expiry: 'EXPIRED', active: 'all' }],
  ]
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">{cards.map(([label, value, filters]) => <button key={label} className="inv-panel text-left transition hover:border-[#B48660]" onClick={() => onFilter(filters)}><span className="text-xs text-stone-500">{label}</span><strong className="mt-2 block break-words text-xl">{value}</strong></button>)}</div>
}
export function InventoryAlerts({ items, state, onAction, onFilter }) {
  const alerts = useMemo(() => {
    const checked = new Map()
    for (const count of state.counts) if (count.status === 'CONFIRMED' && (!checked.has(count.itemId) || checked.get(count.itemId) < count.countedAt)) checked.set(count.itemId, count.countedAt)
    return items.filter(i => i.active).map(item => {
      const lastCount = checked.get(item.id)
      const old = !lastCount || Date.now() - Date.parse(lastCount) > 30 * 86400000
      const imports = item.batches.slice().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      const expensive = imports.length > 1 && imports[1].unitCost > 0 && imports[0].unitCost > imports[1].unitCost * 1.2
      const reasons = [item.status === 'OUT_OF_STOCK' && 'Hết hàng', item.status === 'LOW_STOCK' && 'Sắp hết hàng', item.expiryStatuses.includes('EXPIRED') && 'Có lô hết hạn', item.expiryStatuses.includes('EXPIRING_SOON') && 'Hạn trong 7 ngày', old && (lastCount ? 'Hơn 30 ngày chưa kiểm' : 'Chưa kiểm kho'), expensive && 'Giá nhập tăng trên 20%'].filter(Boolean)
      return { item, reasons }
    }).filter(row => row.reasons.length)
  }, [items, state.counts])
  return <section className="inv-panel"><h2 className="text-lg font-bold">Cần chú ý <span className="text-stone-400">· {alerts.length}</span></h2><p className="inv-help">Cảnh báo kiểm kho sau 30 ngày; giá tăng khi vượt 20% so với lô trước.</p><div className="mb-3 flex flex-wrap gap-2"><Button onClick={() => onFilter({ status: 'OUT_OF_STOCK' })}>Hết hàng</Button><Button onClick={() => onFilter({ status: 'LOW_STOCK' })}>Sắp hết</Button><Button onClick={() => onFilter({ expiry: 'EXPIRED' })}>Hết hạn</Button><Button onClick={() => onFilter({ expiry: 'EXPIRING_SOON' })}>Hạn 7 ngày</Button></div><div className="max-h-80 space-y-2 overflow-y-auto">{alerts.map(({ item, reasons }) => <button key={item.id} className="block w-full rounded-xl bg-[#FCF9F4] p-3 text-left" onClick={() => onAction('detail', item.id)}><strong>{item.name}</strong><p className="text-xs text-stone-600">{reasons.join(' · ')}</p></button>)}{!alerts.length && <Empty>Không có cảnh báo.</Empty>}</div></section>
}
export function PurchaseSuggestions({ items, state, onSave, onImport }) {
  const [deletePlan, setDeletePlan] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [quantities, setQuantities] = useState({})
  const [error, setError] = useState('')
  const suggestions = items.filter(i => i.active && suggestedQuantity(i) > 0)
  const rows = suggestions.map(item => ({ itemId: item.id, quantity: Number(quantities[item.id] ?? suggestedQuantity(item)) })).filter(r => r.quantity !== 0)
  return <section className="inv-panel"><h2 className="text-lg font-bold">Đề xuất nhập hàng</h2><p className="inv-help">Bổ sung tới định mức tháng hoặc điểm đặt hàng. Lưu dự kiến chưa làm thay đổi tồn.</p><div className="max-h-80 space-y-3 overflow-y-auto">{suggestions.map(item => <div key={item.id} className="grid grid-cols-[1fr_110px] items-center gap-3"><div><strong className="text-sm">{item.name}</strong><p className="text-xs text-stone-500">{item.supplier || 'Chưa có NCC'} · {item.packSize}</p></div><Field label="SL đề xuất" aria-label={`Số lượng đề xuất ${item.name}`} type="number" min="0" step="any" value={quantities[item.id] ?? suggestedQuantity(item)} onChange={e => setQuantities({ ...quantities, [item.id]: e.target.value })} /></div>)}{!suggestions.length && <Empty>Đã đủ định mức.</Empty>}</div><p className="my-3 font-bold">Dự kiến: {money(rows.reduce((sum, r) => sum + r.quantity * items.find(i => i.id === r.itemId).unitPrice, 0))}</p><Button primary disabled={!rows.length} onClick={() => { try { onSave('PLAN', { rows }, false); setError('') } catch (err) { setError(err.message) } }}>Lưu phiếu nhập dự kiến</Button>{error && <p className="inv-error" role="alert">{error}</p>}<div className="mt-4 max-h-52 space-y-2 overflow-y-auto">{state.plans.slice().reverse().map(plan => <div className="rounded-xl bg-stone-50 p-3" key={plan.id}><p className="text-sm">{plan.status === 'RECEIVED' ? 'Đã nhập' : 'Nháp'} · {dateTime(plan.createdAt)} · {plan.rows.length} nguyên liệu</p><Button disabled={plan.status === 'RECEIVED'} onClick={() => onImport(plan.rows, plan.id)}>Mở phiếu nhập để xác nhận</Button>{plan.status === 'DRAFT' && <Button className="ml-2 text-red-700" onClick={() => { setDeletePlan(plan); setDeleteError('') }}>Xóa phiếu nháp</Button>}</div>)}</div>
    {deletePlan && <Dialog title="Xóa phiếu nhập dự kiến" onClose={() => setDeletePlan(null)}>
      <form onSubmit={event => {
        event.preventDefault()
        try {
          onSave('DELETE_PLAN', { planId: deletePlan.id }, false)
          setDeletePlan(null)
        } catch (err) { setDeleteError(err.message) }
      }}>
        <p>Bạn muốn xóa phiếu nháp tạo lúc {dateTime(deletePlan.createdAt)}, gồm {deletePlan.rows.length} nguyên liệu?</p>
        <p className="inv-help">Xóa phiếu dự kiến không làm thay đổi tồn kho.</p>
        {deleteError && <p className="inv-error" role="alert">{deleteError}</p>}
        <FormFooter onClose={() => setDeletePlan(null)} label="Xác nhận xóa phiếu nháp" />
      </form>
    </Dialog>}
  </section>
}
function Bars({ title, rows }) {
  const max = Math.max(...rows.map(row => Math.abs(row.value)), 1)
  return <section className="inv-panel"><h3 className="mb-4 font-bold">{title}</h3>{rows.length ? <div className="max-h-80 space-y-3 overflow-y-auto">{rows.map(row => <div key={row.label}><div className="flex justify-between gap-3 text-xs"><span>{row.label}</span><strong>{money(row.value)}</strong></div><div className="mt-1 h-2 rounded bg-stone-100"><div className={`h-full rounded ${row.value < 0 ? 'bg-amber-500' : 'bg-[#B48660]'}`} style={{ width: `${Math.abs(row.value) / max * 100}%` }} /></div></div>)}</div> : <Empty>Chưa có dữ liệu trong kỳ.</Empty>}</section>
}
export function InventoryAnalytics({ items, state }) {
  const [days, setDays] = useState(7)
  const data = useMemo(() => {
    const groups = new Map()
    items.forEach(i => groups.set(i.category, (groups.get(i.category) || 0) + i.inventoryValue))
    const series = new Map()
    const end = Date.parse(localDate())
    for (let n = days - 1; n >= 0; n--) series.set(new Date(end - n * 86400000).toISOString().slice(0, 10), { imported: 0, exported: 0, discarded: 0, difference: 0 })
    state.transactions.forEach(t => {
      const row = series.get(localDate(new Date(t.occurredAt)))
      if (!row) return
      const value = t.quantity * (t.unitCost || 0)
      if (t.type === 'IMPORT') row.imported += value
      if (['EXPORT', 'RETURN', 'DISCARD'].includes(t.type)) row.exported += value
      if (t.type === 'DISCARD') row.discarded += value
    })
    state.counts.filter(c => c.status === 'CONFIRMED').forEach(c => { const row = series.get(localDate(new Date(c.countedAt))); if (row) row.difference += c.differenceValue })
    const metric = key => [...series].map(([label, values]) => ({ label: new Date(label).toLocaleDateString('vi-VN', { timeZone: 'UTC' }), value: values[key] }))
    return { groups: [...groups].map(([label, value]) => ({ label, value })), top: items.slice().sort((a, b) => b.inventoryValue - a.inventoryValue).slice(0, 10).map(i => ({ label: `${i.name} · ${i.sku}`, value: i.inventoryValue })), imported: metric('imported'), exported: metric('exported'), discarded: metric('discarded'), difference: metric('difference') }
  }, [items, state, days])
  return <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Phân tích kho</h2><Field label="Khoảng thời gian" value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>7 ngày</option><option value={30}>30 ngày</option></Field></div><div className="grid gap-4 xl:grid-cols-2"><Bars title="Giá trị tồn theo nhóm" rows={data.groups} /><Bars title="Top 10 giá trị tồn" rows={data.top} /><Bars title="Giá trị nhập theo ngày" rows={data.imported} /><Bars title="Giá trị xuất theo ngày (gồm hủy, trả)" rows={data.exported} /><Bars title="Giá trị hủy do hết hạn / hư hỏng" rows={data.discarded} /><Bars title="Chênh lệch kiểm kho theo ngày" rows={data.difference} /></div></section>
}
export function ThresholdDialog({ items, onSave, onClose }) {
  const [rows, setRows] = useState({})
  const [error, setError] = useState('')
  return <Dialog title="Thiết lập tồn tối thiểu" onClose={onClose}><form onSubmit={e => { e.preventDefault(); try { onSave('THRESHOLDS', { rows: Object.entries(rows).map(([itemId, row]) => ({ itemId, ...row })) }) } catch (err) { setError(err.message) } }}><p className="inv-help">Cảnh báo sắp hết dựa trên điểm đặt hàng. Các ngưỡng ban đầu bằng 0 để bạn tự thiết lập.</p><div className="max-h-[60vh] space-y-3 overflow-y-auto">{items.filter(i => i.active).map(item => <div className="inv-panel" key={item.id}><strong>{item.name} · {item.packSize}</strong><div className="inv-grid">{[['minimumStock', 'Tồn tối thiểu'], ['reorderPoint', 'Điểm đặt hàng']].map(([key, label]) => <Field key={key} label={label} type="number" min="0" step="any" required value={rows[item.id]?.[key] ?? item[key]} onChange={e => setRows({ ...rows, [item.id]: { minimumStock: item.minimumStock, reorderPoint: item.reorderPoint, ...rows[item.id], [key]: e.target.value } })} />)}</div></div>)}</div>{error && <p className="inv-error" role="alert">{error}</p>}<FormFooter onClose={onClose} /></form></Dialog>
}
