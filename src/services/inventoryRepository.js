import { createSeed } from '../data/inventorySeed.js'
import { allocation, inventoryItems, round } from './inventoryCalculations.js'
import { dateOnly, iso, nonnegative, validateItem } from './inventoryValidators.js'

export const STORAGE_KEY = 'my-store.inventory.v1'
const id = () => globalThis.crypto.randomUUID()
const empty = () => ({ version: 1, revision: 0, items: createSeed(), batches: [], transactions: [], counts: [], plans: [], audit: [] })
export function validateState(state) {
  if (state?.version !== 1 || !Number.isInteger(state.revision) || !['items', 'batches', 'transactions', 'counts', 'plans', 'audit'].every(key => Array.isArray(state[key]))) throw new Error('Dữ liệu kho không đúng định dạng v1. Dữ liệu gốc được giữ nguyên.')
  for (const key of ['items', 'batches', 'transactions', 'counts', 'plans', 'audit']) {
    if (new Set(state[key].map(row => row.id)).size !== state[key].length || state[key].some(row => !row.id)) throw new Error(`ID trùng hoặc thiếu trong ${key}.`)
  }
  const items = new Set(state.items.map(i => i.id))
  if (new Set(state.items.map(i => i.sku.toLowerCase())).size !== state.items.length) throw new Error('SKU trùng lặp.')
  const numeric = (row, fields) => fields.forEach(field => { if (typeof row[field] !== 'number' || !Number.isFinite(row[field])) throw new Error(`Trường ${field} phải là số hữu hạn.`) })
  state.items.forEach(item => {
    validateItem(item); iso(item.createdAt); iso(item.updatedAt)
    numeric(item, ['unitPrice', 'monthlyTargetQty', 'minimumStock', 'reorderPoint', 'conversionRate'])
    if (typeof item.active !== 'boolean' || ['name', 'sku', 'category', 'baseUnit', 'packSize'].some(key => typeof item[key] !== 'string')) throw new Error('Thông tin nguyên liệu không hợp lệ.')
  })
  state.batches.forEach(batch => {
    numeric(batch, ['remainingQuantity', 'receivedQuantity', 'unitCost'])
    if (!items.has(batch.itemId)) throw new Error('Lô không thuộc nguyên liệu nào.')
    nonnegative(batch.remainingQuantity, 'Tồn lô'); nonnegative(batch.receivedQuantity, 'Lượng nhập'); nonnegative(batch.unitCost, 'Giá nhập'); iso(batch.receivedAt)
    if (batch.remainingQuantity > batch.receivedQuantity) throw new Error('Tồn lô vượt lượng nhập.')
    if (batch.expiryDate) dateOnly(batch.expiryDate)
    if (batch.manufactureDate) dateOnly(batch.manufactureDate)
    if (batch.expiryDate && batch.manufactureDate && batch.expiryDate < batch.manufactureDate) throw new Error('Hạn sử dụng trước ngày sản xuất.')
  })
  state.transactions.forEach(t => {
    numeric(t, ['quantity', 'stockBefore', 'stockAfter'])
    if (!items.has(t.itemId) || !['IMPORT', 'EXPORT', 'COUNT', 'ADJUST_IN', 'ADJUST_OUT', 'DISCARD', 'RETURN'].includes(t.type)) throw new Error('Giao dịch không hợp lệ.')
    if (t.batchId && !state.batches.some(b => b.id === t.batchId && b.itemId === t.itemId)) throw new Error('Giao dịch tham chiếu lô không hợp lệ.')
    nonnegative(t.quantity, 'Số lượng'); nonnegative(t.stockBefore, 'Tồn trước'); nonnegative(t.stockAfter, 'Tồn sau'); iso(t.occurredAt)
  })
  state.counts.forEach(c => {
    numeric(c, ['actualQuantity', 'systemQuantity', 'difference', 'differenceValue'])
    if (!items.has(c.itemId) || !['DRAFT', 'CONFIRMED'].includes(c.status)) throw new Error('Phiếu kiểm không hợp lệ.')
    nonnegative(c.actualQuantity, 'Tồn thực tế'); nonnegative(c.systemQuantity, 'Tồn hệ thống'); iso(c.countedAt)
  })
  state.plans.forEach(plan => {
    iso(plan.createdAt)
    if (!['DRAFT', 'RECEIVED'].includes(plan.status) || !Array.isArray(plan.rows)) throw new Error('Phiếu dự kiến không hợp lệ.')
    plan.rows.forEach(row => { if (!items.has(row.itemId)) throw new Error('Phiếu dự kiến chứa nguyên liệu không tồn tại.'); numeric(row, ['quantity']); nonnegative(row.quantity, 'Số lượng dự kiến', true) })
  })
  state.audit.forEach(event => { if (!items.has(event.itemId)) throw new Error('Lịch sử sửa thông tin không hợp lệ.'); iso(event.occurredAt) })
  return state
}
export function createRepository(storage) {
  let saved = null
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY)
      if (raw !== null) { const state = validateState(JSON.parse(raw)); saved = raw; return state }
      // Migrate the versioned split-key format only when all stock ledgers exist.
      const keys = ['items', 'batches', 'transactions', 'counts'].map(key => `my-store.inventory.${key}.v1`)
      const parts = keys.map(key => storage.getItem(key))
      let state = empty()
      if (parts.some(p => p !== null)) {
        if (parts.some(p => p === null)) throw new Error('Dữ liệu kho cũ thiếu sổ lô/giao dịch. Giữ nguyên dữ liệu; cần phục hồi bản sao đầy đủ.')
        state = validateState({ ...state, ...Object.fromEntries(['items', 'batches', 'transactions', 'counts'].map((key, index) => [key, JSON.parse(parts[index])])) })
      }
      saved = JSON.stringify(state)
      storage.setItem(STORAGE_KEY, saved)
      return state
    },
    save(state) {
      validateState(state)
      if (storage.getItem(STORAGE_KEY) !== saved) throw new Error('Kho đã thay đổi ở tab khác. Đóng biểu mẫu và tải lại dữ liệu trước khi tiếp tục.')
      const raw = JSON.stringify(state)
      storage.setItem(STORAGE_KEY, raw)
      saved = raw
      return state
    },
  }
}
function itemFor(state, itemId) {
  const item = inventoryItems(state).find(i => i.id === itemId)
  if (!item) throw new Error('Không tìm thấy nguyên liệu.')
  return item
}
function transaction(state, itemId, type, quantity, before, after, details) {
  state.transactions.push({ id: id(), itemId, type, quantity, stockBefore: before, stockAfter: after, ...details })
  const item = state.items.find(i => i.id === itemId)
  item.updatedAt = new Date().toISOString()
}
function receive(state, row, common, type = 'IMPORT') {
  const item = itemFor(state, row.itemId)
  if (!item.active) throw new Error('Nguyên liệu đã ngừng theo dõi.')
  const quantity = nonnegative(row.quantity, 'Số lượng nhập', true)
  const unitCost = nonnegative(row.unitCost, 'Giá nhập')
  const manufactureDate = dateOnly(row.manufactureDate)
  const expiryDate = dateOnly(row.expiryDate)
  if (manufactureDate && expiryDate && expiryDate < manufactureDate) throw new Error('Hạn sử dụng không được trước ngày sản xuất.')
  const receivedAt = iso(common.occurredAt)
  const batch = { id: id(), itemId: item.id, batchCode: row.batchCode || `LO-${Date.now()}-${state.batches.length + 1}`, receivedQuantity: quantity, remainingQuantity: quantity, unitCost, manufactureDate, expiryDate, receivedAt, supplier: row.supplier || item.supplier, invoiceCode: common.invoiceCode || '', note: common.note || '', createdBy: common.createdBy || '' }
  state.batches.push(batch)
  transaction(state, item.id, type, quantity, item.currentStock, round(item.currentStock + quantity), { ...common, occurredAt: receivedAt, batchId: batch.id, unitCost })
}
function issue(state, payload, type) {
  const item = itemFor(state, payload.itemId)
  const quantity = nonnegative(payload.quantity, 'Số lượng xuất', true)
  if (!payload.reason?.trim()) throw new Error('Cần ghi lý do xuất/điều chỉnh.')
  const portions = allocation(state.batches, item.id, quantity)
  let before = item.currentStock
  for (const portion of portions) {
    const batch = state.batches.find(b => b.id === portion.id)
    batch.remainingQuantity = round(batch.remainingQuantity - portion.quantity)
    const after = round(before - portion.quantity)
    transaction(state, item.id, type, portion.quantity, before, after, { batchId: batch.id, unitCost: batch.unitCost, reason: payload.reason, note: payload.note || '', createdBy: payload.createdBy || '', occurredAt: iso(payload.occurredAt) })
    before = after
  }
  return portions.reduce((sum, p) => sum + p.quantity * p.unitCost, 0)
}
export function applyOperation(previous, action, payload) {
  const state = structuredClone(previous)
  const now = new Date().toISOString()
  if (action === 'IMPORT') {
    if (!payload.rows?.length) throw new Error('Phiếu nhập chưa có nguyên liệu.')
    const plan = payload.planId ? state.plans.find(p => p.id === payload.planId) : null
    if (payload.planId && (!plan || plan.status !== 'DRAFT')) throw new Error('Phiếu dự kiến này đã được nhập hoặc không tồn tại.')
    payload.rows.forEach(row => receive(state, row, payload))
    if (plan) { plan.status = 'RECEIVED'; plan.receivedAt = now }
  } else if (action === 'EXPORT') {
    const types = { use: 'EXPORT', expired: 'DISCARD', damaged: 'DISCARD', supplier: 'RETURN', other: 'ADJUST_OUT' }
    if (!types[payload.purpose]) throw new Error('Mục đích xuất không hợp lệ.')
    issue(state, payload, types[payload.purpose])
  } else if (action === 'COUNT') {
    if (!payload.rows?.length) throw new Error('Chưa nhập số lượng kiểm thực tế.')
    if (new Set(payload.rows.map(r => r.itemId)).size !== payload.rows.length) throw new Error('Một nguyên liệu chỉ được kiểm một lần mỗi phiếu.')
    for (const row of payload.rows) {
      const item = itemFor(state, row.itemId)
      if (!item.active) throw new Error('Nguyên liệu đã ngừng theo dõi.')
      const existing = row.id ? state.counts.find(c => c.id === row.id) : null
      if (row.id && (!existing || existing.status !== 'DRAFT')) throw new Error('Phiếu kiểm đã xác nhận hoặc không còn tồn tại.')
      const actualQuantity = nonnegative(row.actualQuantity, 'Tồn thực tế')
      const difference = round(actualQuantity - item.currentStock)
      const unitCost = item.currentStock ? item.inventoryValue / item.currentStock : item.unitPrice
      let differenceValue = difference * unitCost
      const details = { occurredAt: now, createdBy: payload.createdBy || '', reason: row.reason || 'Kiểm kho thực tế' }
      if (payload.confirmed) {
        if (difference > 0) receive(state, { itemId: item.id, quantity: difference, unitCost }, details, 'ADJUST_IN')
        if (difference < 0) differenceValue = -issue(state, { ...details, itemId: item.id, quantity: -difference }, 'ADJUST_OUT')
        transaction(state, item.id, 'COUNT', actualQuantity, item.currentStock, actualQuantity, details)
      }
      const count = { id: existing?.id || id(), sessionId: payload.sessionId || now, itemId: item.id, systemQuantity: item.currentStock, actualQuantity, difference, differenceValue, countedAt: now, countedBy: payload.createdBy || '', reason: details.reason, status: payload.confirmed ? 'CONFIRMED' : 'DRAFT' }
      if (existing) Object.assign(existing, count)
      else state.counts.push(count)
    }
  } else if (action === 'ITEM') {
    const existing = payload.id ? state.items.find(i => i.id === payload.id) : null
    if (payload.id && !existing) throw new Error('Nguyên liệu không tồn tại.')
    const fields = ['name', 'category', 'supplier', 'brand', 'packSize', 'baseUnit', 'storageLocation', 'contentUnit']
    const item = existing || { id: id(), sku: `NL-${id().slice(0, 8).toUpperCase()}`, sourceGroup: '', createdAt: now, active: true }
    for (const field of fields) item[field] = String(payload[field] || '').trim()
    for (const field of ['unitPrice', 'monthlyTargetQty', 'minimumStock', 'reorderPoint', 'conversionRate']) item[field] = nonnegative(payload[field], field, field === 'conversionRate')
    item.updatedAt = now
    validateItem(item)
    if (existing && state.batches.some(b => b.itemId === item.id) && ['baseUnit', 'conversionRate', 'packSize'].some(key => previous.items.find(i => i.id === item.id)[key] !== item[key])) throw new Error('Đã có lô hàng: không đổi đơn vị/quy cách để giữ đúng lịch sử.')
    if (!existing) state.items.push(item)
    state.audit.push({ id: id(), itemId: item.id, occurredAt: now, reason: existing ? 'Chỉnh thông tin nguyên liệu' : 'Thêm nguyên liệu', before: existing ? previous.items.find(i => i.id === item.id) : null, after: { ...item } })
  } else if (action === 'ACTIVE') {
    const item = itemFor(state, payload.itemId)
    if (item.active && item.currentStock > 0) throw new Error('Cần xử lý hết tồn trước khi ngừng theo dõi.')
    Object.assign(state.items.find(i => i.id === item.id), { active: !item.active, updatedAt: now })
    state.audit.push({ id: id(), itemId: item.id, occurredAt: now, reason: item.active ? 'Ngừng theo dõi' : 'Theo dõi trở lại', stockBefore: item.currentStock, stockAfter: item.currentStock })
  } else if (action === 'EXPIRY') {
    const batch = state.batches.find(b => b.id === payload.batchId)
    if (!batch || !payload.reason?.trim()) throw new Error('Cần chọn lô và ghi lý do sửa hạn.')
    const expiryDate = dateOnly(payload.expiryDate)
    if (expiryDate && batch.manufactureDate && expiryDate < batch.manufactureDate) throw new Error('Hạn sử dụng trước ngày sản xuất.')
    const item = itemFor(state, batch.itemId)
    state.audit.push({ id: id(), itemId: batch.itemId, batchId: batch.id, occurredAt: now, reason: payload.reason, note: `Hạn: ${batch.expiryDate || 'không có'} → ${expiryDate || 'không có'}`, stockBefore: item.currentStock, stockAfter: item.currentStock, createdBy: payload.createdBy || '' })
    batch.expiryDate = expiryDate
    state.items.find(i => i.id === item.id).updatedAt = now
  } else if (action === 'PLAN') {
    const rows = payload.rows.map(row => { itemFor(state, row.itemId); return { itemId: row.itemId, quantity: nonnegative(row.quantity, 'Số lượng dự kiến', true) } })
    if (!rows.length) throw new Error('Chưa có mặt hàng đề xuất.')
    state.plans.push({ id: id(), createdAt: now, status: 'DRAFT', rows })
  } else if (action === 'DELETE_PLAN') {
    const plan = state.plans.find(p => p.id === payload.planId)
    if (!plan) throw new Error('Phiếu nhập dự kiến không còn tồn tại.')
    if (plan.status !== 'DRAFT') throw new Error('Chỉ có thể xóa phiếu nhập dự kiến còn nháp.')
    state.plans = state.plans.filter(p => p.id !== plan.id)
  } else if (action === 'THRESHOLDS') {
    for (const row of payload.rows) {
      const item = state.items.find(i => i.id === row.itemId)
      if (!item) throw new Error('Nguyên liệu không tồn tại.')
      const before = { minimumStock: item.minimumStock, reorderPoint: item.reorderPoint }
      item.minimumStock = nonnegative(row.minimumStock, 'Tồn tối thiểu')
      item.reorderPoint = nonnegative(row.reorderPoint, 'Điểm đặt hàng')
      item.updatedAt = now
      state.audit.push({ id: id(), itemId: item.id, occurredAt: now, reason: 'Thiết lập ngưỡng tồn', before, after: { minimumStock: item.minimumStock, reorderPoint: item.reorderPoint } })
    }
  } else throw new Error('Thao tác không được hỗ trợ.')
  state.revision += 1
  return validateState(state)
}
