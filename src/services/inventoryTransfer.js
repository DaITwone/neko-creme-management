import { validateState } from './inventoryRepository.js'
export function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function exportCsv(items) {
  const columns = { name: 'Nguyên liệu', sku: 'SKU', category: 'Nhóm hàng', supplier: 'Nhà cung cấp', sourceGroup: 'Nhóm nguồn', brand: 'Hãng', packSize: 'Quy cách', baseUnit: 'Đơn vị', unitPrice: 'Đơn giá', monthlyTargetQty: 'Định mức tháng', currentStock: 'Tồn hiện tại', minimumStock: 'Tồn tối thiểu', reorderPoint: 'Điểm đặt hàng', inventoryValue: 'Giá trị tồn', storageLocation: 'Vị trí', updatedAt: 'Cập nhật' }
  const escape = value => `"${String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`
  const csv = [Object.values(columns), ...items.map(item => Object.keys(columns).map(key => item[key]))].map(row => row.map(escape).join(',')).join('\r\n')
  download('\uFEFF' + csv, 'ton-kho.csv', 'text/csv;charset=utf-8')
}
export function parseBackup(text) {
  if (text.length > 20 * 1024 * 1024) throw new Error('Tệp vượt 20 MB.')
  return validateState(JSON.parse(text))
}
export function mergeBackup(current, incoming) {
  const next = structuredClone(current)
  for (const key of ['items', 'batches', 'transactions', 'counts', 'plans', 'audit']) {
    const index = new Map(next[key].map((row, i) => [row.id, i]))
    for (const row of incoming[key]) {
      const position = index.get(row.id)
      if (position == null) { next[key].push(row); continue }
      if (JSON.stringify(next[key][position]) === JSON.stringify(row)) continue
      // Initial seed metadata can be replaced, but never overwrite an existing ledger.
      if (key === 'items' && !current.batches.some(b => b.itemId === row.id) && !current.transactions.some(t => t.itemId === row.id) && !current.counts.some(c => c.itemId === row.id)) next[key][position] = row
      else throw new Error(`Xung đột ${key}: ${row.id}. Không ghi đè lịch sử hiện có; dùng hồ sơ trình duyệt trống để phục hồi bản sao.`)
    }
  }
  next.revision += 1
  return validateState(next)
}
