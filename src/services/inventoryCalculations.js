export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
export const number = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value || 0)
export const dateTime = value => value ? new Date(value).toLocaleString('vi-VN') : '—'
export const round = value => Math.round(value * 1e6) / 1e6
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()
export const stockStatus = item => item.currentStock <= 0 ? 'OUT_OF_STOCK' : item.currentStock <= item.reorderPoint ? 'LOW_STOCK' : 'NORMAL'
export const suggestedQuantity = item => round(Math.max(item.monthlyTargetQty - item.currentStock, item.reorderPoint - item.currentStock, 0))
export const localDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
export function expiryInfo(value, today = localDate()) {
  if (!value) return { status: 'NO_EXPIRY', days: null }
  const days = Math.round((Date.parse(value.slice(0, 10)) - Date.parse(today)) / 86400000)
  return { days, status: days < 0 ? 'EXPIRED' : days <= 7 ? 'EXPIRING_SOON' : days <= 30 ? 'EXPIRING_30_DAYS' : 'SAFE' }
}
export function orderedBatches(batches, itemId) {
  return batches.filter(b => b.itemId === itemId && b.remainingQuantity > 0).sort((a, b) =>
    (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999') || a.receivedAt.localeCompare(b.receivedAt) || a.id.localeCompare(b.id))
}
export function allocation(batches, itemId, quantity) {
  let needed = quantity
  const result = []
  for (const batch of orderedBatches(batches, itemId)) {
    if (needed <= 0) break
    const take = Math.min(needed, batch.remainingQuantity)
    result.push({ ...batch, quantity: take })
    needed = round(needed - take)
  }
  if (needed > 0) throw new Error('Số lượng xuất vượt tồn hiện tại.')
  return result
}
export function inventoryItems(state, today = localDate()) {
  const byItem = new Map()
  for (const batch of state.batches) {
    if (!byItem.has(batch.itemId)) byItem.set(batch.itemId, [])
    byItem.get(batch.itemId).push(batch)
  }
  return state.items.map(item => {
    const batches = byItem.get(item.id) || []
    const remaining = batches.filter(b => b.remainingQuantity > 0)
    const currentStock = round(remaining.reduce((sum, b) => sum + b.remainingQuantity, 0))
    const inventoryValue = remaining.reduce((sum, b) => sum + b.remainingQuantity * b.unitCost, 0)
    const nearest = remaining.filter(b => b.expiryDate).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0]
    return { ...item, batches, currentStock, inventoryValue, nearest, status: stockStatus({ ...item, currentStock }), expiryStatuses: remaining.length ? [...new Set(remaining.map(b => expiryInfo(b.expiryDate, today).status))] : ['NO_EXPIRY'], search: normalize([item.name, item.sku, item.brand, item.supplier].join(' ')) }
  })
}
export function filterItems(items, filters) {
  const query = normalize(filters.search)
  const result = items.filter(item => (filters.active === 'all' || item.active === (filters.active !== 'inactive')) &&
    (!query || item.search.includes(query)) && (!filters.category || item.category === filters.category) &&
    (!filters.supplier || item.supplier === filters.supplier) && (!filters.location || item.storageLocation === filters.location) &&
    (!filters.status || item.status === filters.status) && (!filters.expiry || item.expiryStatuses.includes(filters.expiry)))
  const sorts = {
    name: (a, b) => a.name.localeCompare(b.name, 'vi'), stock: (a, b) => a.currentStock - b.currentStock,
    value: (a, b) => b.inventoryValue - a.inventoryValue,
    expiry: (a, b) => (a.nearest?.expiryDate || '9999').localeCompare(b.nearest?.expiryDate || '9999'),
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  }
  return result.sort(sorts[filters.sort] || sorts.name)
}
