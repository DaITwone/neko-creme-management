export function nonnegative(value, label, positive = false) {
  if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < 0 || (positive && Number(value) === 0)) throw new Error(`${label} phải là số ${positive ? 'lớn hơn 0' : 'không âm'}.`)
  if (Number(value) > 1e12) throw new Error(`${label} quá lớn.`)
  return Number(value)
}
export function iso(value, label = 'Ngày giờ') {
  if (!value || !Number.isFinite(Date.parse(value))) throw new Error(`${label} không hợp lệ.`)
  return new Date(value).toISOString()
}
export function dateOnly(value) {
  if (!value) return ''
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) throw new Error('Ngày không hợp lệ.')
  const result = iso(`${value.slice(0, 10)}T00:00:00.000Z`)
  if (result.slice(0, 10) !== value.slice(0, 10)) throw new Error('Ngày không tồn tại trong lịch.')
  return result
}
export function validateItem(item) {
  for (const key of ['name', 'sku', 'category', 'baseUnit']) if (!String(item[key] || '').trim()) throw new Error(`Thiếu ${key}.`)
  for (const key of ['unitPrice', 'monthlyTargetQty', 'minimumStock', 'reorderPoint']) nonnegative(item[key], key)
  nonnegative(item.conversionRate, 'Tỷ lệ quy đổi', true)
}
