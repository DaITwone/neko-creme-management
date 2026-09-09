import source from './inventorySource.json' with { type: 'json' }

export const categories = ['Kem', 'Trà và bột pha chế', 'Syrup và sốt', 'Cà phê', 'Sữa', 'Trái cây', 'Topping', 'Bao bì và dụng cụ dùng một lần', 'Nguyên liệu làm bánh', 'Vật tư vệ sinh', 'Nước uống', 'Thành phẩm/đồ ăn hợp tác', 'Khác']
const groups = [
  [3, 12, 0], [13, 13, 1], [14, 14, 8], [15, 16, 1], [17, 17, 6], [18, 19, 1],
  [20, 33, 2], [34, 36, 6], [37, 37, 8], [38, 38, 6], [39, 40, 3], [41, 44, 4],
  [45, 54, 5], [55, 55, 1], [56, 57, 8], [58, 58, 6], [59, 60, 4], [61, 61, 10],
  [62, 62, 9], [63, 75, 7], [76, 76, 4], [77, 77, 8], [78, 78, 7], [79, 80, 9],
  [81, 81, 7], [82, 82, 9], [83, 83, 10], [84, 84, 9], [85, 85, 6], [86, 86, 11],
]
const prefixes = ['KEM', 'TRA', 'SYR', 'CAF', 'SUA', 'TC', 'TOP', 'BB', 'BANH', 'VS', 'NUOC', 'TP', 'KHAC']
const suppliers = ['GLOFOOD', 'PHACHEVIET', 'NHẤT HƯƠNG', 'KAMEREO', 'SONG NGUYÊN', 'HOA ĐĂNG']
export function parsePack(packSize) {
  const match = packSize.match(/^(\d+(?:\.\d+)?)\s*(kg|gr|g|ml|l)$/i)
  if (match) return { conversionRate: Number(match[1]) * (/^(kg|l)$/i.test(match[2]) ? 1000 : 1), contentUnit: /^(l|ml)$/i.test(match[2]) ? 'ml' : 'g' }
  const count = packSize.match(/\((\d+)\s+(chai|cái|gói|cuộn)\)/i)
  return { conversionRate: count ? Number(count[1]) : 1, contentUnit: count ? count[2] : 'đơn vị mua' }
}
export function createSeed(now = new Date().toISOString()) {
  const sequence = {}
  return source.map(row => {
    const categoryIndex = groups.find(([start, end]) => row.row >= start && row.row <= end)?.[2] ?? 12
    sequence[categoryIndex] = (sequence[categoryIndex] || 0) + 1
    return {
      ...row, id: `excel-cost-${row.row}`, sku: `${prefixes[categoryIndex]}-${String(sequence[categoryIndex]).padStart(3, '0')}`,
      category: categories[categoryIndex], supplier: suppliers.includes(row.sourceGroup) ? row.sourceGroup : ['Market', 'Shopee'].includes(row.brand) ? row.brand : '',
      brand: row.brand || '', packSize: row.packSize || '', baseUnit: 'đơn vị mua', ...parsePack(row.packSize || ''),
      minimumStock: 0, reorderPoint: 0, currentStock: 0, inventoryValue: 0, storageLocation: '', active: true, createdAt: now, updatedAt: now,
    }
  })
}
