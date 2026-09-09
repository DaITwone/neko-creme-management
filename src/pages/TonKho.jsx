import { useEffect, useMemo, useRef, useState } from 'react'
import { PackageSearch, Plus, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck } from 'lucide-react'
import { applyOperation, createRepository } from '../services/inventoryRepository'
import { filterItems, inventoryItems, localDate, money } from '../services/inventoryCalculations'
import { download, exportCsv, mergeBackup } from '../services/inventoryTransfer'
import { Button, Dialog, Field, FormFooter } from '../components/inventory/InventoryUI'
import { defaultFilters, InventoryList, InventoryToolbar } from '../components/inventory/InventoryList'
import { ItemDialog, StockCountDialog, StockExportDialog, StockImportDialog } from '../components/inventory/StockDialogs'
import { InventoryHistory, InventoryItemDrawer } from '../components/inventory/InventoryItemDrawer'
import { InventoryAlerts, InventoryAnalytics, InventorySummaryCards, PurchaseSuggestions, ThresholdDialog } from '../components/inventory/InventoryPanels'
import DataImportDialog from '../components/inventory/DataImportDialog'
import '../components/inventory/inventory.css'

export default function TonKho() {
  const repository = useRef(null)
  const [state, setState] = useState(null)
  const current = useRef(null)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({ ...defaultFilters })
  const [search, setSearch] = useState('')
  const [view, setView] = useState('inventory')
  const [modal, setModal] = useState(null)
  const [actionError, setActionError] = useState('')
  const [today, setToday] = useState(localDate)
  function load() {
    try {
      repository.current = createRepository(window.localStorage)
      const data = repository.current.load()
      current.current = data; setState(data); setLoadError('')
    } catch (err) { setLoadError(`Không thể đọc/lưu kho: ${err.message}`) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const timer = setTimeout(() => setSearch(filters.search), 220); return () => clearTimeout(timer) }, [filters.search])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 5000); return () => clearTimeout(timer) }, [toast])
  useEffect(() => { const timer = setInterval(() => setToday(localDate()), 60000); return () => clearInterval(timer) }, [])
  const items = useMemo(() => state ? inventoryItems(state, today) : [], [state, today])
  const visible = useMemo(() => filterItems(items, { ...filters, search }), [items, filters, search])
  const selected = items.find(i => i.id === modal?.itemId)
  function persist(next) {
    try { repository.current.save(next); current.current = next; setState(next); setToast({ text: 'Đã lưu dữ liệu kho.', error: false }) }
    catch (err) { setToast({ text: err.message, error: true }); throw err }
  }
  function save(action, payload, close = true) {
    persist(applyOperation(current.current, action, payload))
    if (close) setModal(null)
  }
  function open(kind, itemId) { setActionError(''); setModal({ kind, itemId }) }
  function quickFilter(patch) { setFilters({ ...defaultFilters, ...patch }); setSearch(''); setView('inventory') }
  if (loadError) return <section className="inventory inv-panel"><h1 className="text-xl font-bold">Không thể mở tồn kho</h1><p role="alert" className="inv-error">{loadError}</p><p className="inv-help">Dữ liệu hiện có không bị xóa hoặc seed lại. Kiểm tra quyền lưu trữ của trình duyệt hoặc khôi phục dữ liệu kho hợp lệ.</p><Button onClick={load}>Thử lại</Button></section>
  if (!state) return <div className="inventory inv-panel animate-pulse" role="status">Đang tải dữ liệu kho…</div>
  return <div className="inventory space-y-5"><header className="flex flex-wrap justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A47755]"><PackageSearch size={16} /> Neko Crème · Quản lý kho</p><h1 className="text-2xl uppercase font-extrabold md:text-3xl">Tồn kho nguyên liệu</h1><p className="mt-2 text-sm text-stone-500">Theo dõi hàng nhập, tồn thực tế và hạn sử dụng</p></div><div className="flex flex-wrap items-center gap-2"><Button primary onClick={() => open('import')}><ArrowDownToLine size={16} />Nhập hàng</Button><Button onClick={() => open('count')}><ClipboardCheck size={16} />Kiểm kho</Button><Button onClick={() => open('export')}><ArrowUpFromLine size={16} />Xuất kho</Button><Button onClick={() => open('edit')}><Plus size={16} />Thêm nguyên liệu</Button></div></header>
    <InventorySummaryCards items={items} onFilter={quickFilter} />
    <div className="flex flex-wrap items-end justify-between gap-3"><div className="inv-tabs mb-0">{Object.entries({ inventory: 'Danh mục nguyên liệu', alerts: 'Cảnh báo & đề xuất', analytics: 'Phân tích' }).map(([key, label]) => <Button key={key} primary={view === key} aria-pressed={view === key} onClick={() => setView(key)}>{label}</Button>)}</div><Field label="Tác vụ khác" value="" onChange={e => { const value = e.target.value; if (value === 'csv') exportCsv(visible); else if (value === 'backup') download(JSON.stringify(state, null, 2), `ton-kho-${localDate()}.json`, 'application/json'); else if (value === 'reload') { setModal(null); load() } else if (value) open(value) }}><option value="">Chọn tác vụ</option><option value="csv">Xuất CSV (mở bằng Excel)</option><option value="backup">Xuất bản sao kho JSON</option><option value="data">Nhập dữ liệu JSON</option><option value="history">Xem lịch sử</option><option value="thresholds">Thiết lập tồn tối thiểu</option><option value="reload">Tải lại dữ liệu kho</option></Field></div>
    {view === 'inventory' && <><InventoryToolbar items={items} filters={filters} setFilters={setFilters} /><div className="flex flex-wrap justify-between gap-2 text-sm text-stone-500"><span>{visible.length} / {items.length} nguyên liệu</span><span>Định mức tháng: {money(items.filter(i => i.active).reduce((sum, i) => sum + i.monthlyTargetQty * i.unitPrice, 0))} · Tồn tính theo lô thực tế</span></div><InventoryList items={visible} onAction={open} /></>}
    {view === 'alerts' && <div className="grid gap-4 xl:grid-cols-2"><InventoryAlerts items={items} state={state} onAction={open} onFilter={quickFilter} /><PurchaseSuggestions items={items} state={state} onSave={save} onImport={(rows, planId) => setModal({ kind: 'import', rows, planId })} /></div>}
    {view === 'analytics' && <InventoryAnalytics items={items} state={state} />}
    <p className="text-xs text-stone-500">Dữ liệu lưu trên trình duyệt này. Xuất bản sao JSON định kỳ để phục hồi đầy đủ lô và lịch sử.</p>
    {toast && <div role={toast.error ? 'alert' : 'status'} className={`inv-toast ${toast.error ? 'bg-red-800' : 'bg-[#4B2A1A]'}`}>{toast.text}</div>}
    {modal?.kind === 'import' && <StockImportDialog items={items} initialItem={modal.itemId} initialRows={modal.rows} planId={modal.planId} onSave={save} onClose={() => setModal(null)} />}
    {modal?.kind === 'export' && <StockExportDialog items={items} batches={state.batches} initialItem={modal.itemId} onSave={save} onClose={() => setModal(null)} />}
    {modal?.kind === 'count' && <StockCountDialog items={items} counts={state.counts} initialItem={modal.itemId} onSave={save} onClose={() => setModal(null)} />}
    {modal?.kind === 'edit' && <ItemDialog item={selected} onSave={save} onClose={() => setModal(null)} />}
    {modal?.kind === 'detail' && selected && <InventoryItemDrawer item={selected} state={state} onSave={save} onAction={open} onClose={() => setModal(null)} />}
    {modal?.kind === 'history' && <Dialog title="Lịch sử kho" onClose={() => setModal(null)}><InventoryHistory state={state} /></Dialog>}
    {modal?.kind === 'thresholds' && <ThresholdDialog items={items} onSave={save} onClose={() => setModal(null)} />}
    {modal?.kind === 'data' && <DataImportDialog onClose={() => setModal(null)} onImport={data => { persist(mergeBackup(current.current, data)); setModal(null) }} />}
    {modal?.kind === 'active' && selected && <Dialog title={selected.active ? 'Xác nhận ngừng theo dõi' : 'Theo dõi trở lại'} onClose={() => setModal(null)}><form onSubmit={e => { e.preventDefault(); try { save('ACTIVE', { itemId: selected.id }) } catch (err) { setActionError(err.message) } }}><p>{selected.name}: {selected.active ? 'chỉ có thể ngừng khi đã xử lý hết tồn. Lịch sử vẫn được giữ.' : 'đưa trở lại danh mục đang theo dõi.'}</p>{actionError && <p role="alert" className="inv-error">{actionError}</p>}<FormFooter onClose={() => setModal(null)} label="Xác nhận" /></form></Dialog>}
  </div>
}
