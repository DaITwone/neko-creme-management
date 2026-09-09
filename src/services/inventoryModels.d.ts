/** Quantities and costs use baseUnit (the Excel purchase pack), never grams/ml implicitly. */
export interface InventoryItem {
  id: string; sku: string; name: string; category: string; supplier?: string;
  sourceGroup?: string; brand?: string; packSize: string; baseUnit: string;
  conversionRate: number; contentUnit?: string; unitPrice: number;
  monthlyTargetQty: number; minimumStock: number; reorderPoint: number;
  /** Derived by inventoryItems(), not directly writable. */
  currentStock: number; inventoryValue: number;
  storageLocation?: string; image?: string; active: boolean;
  createdAt: string; updatedAt: string;
}
export interface InventoryBatch {
  id: string; itemId: string; batchCode?: string; receivedQuantity: number;
  remainingQuantity: number; unitCost: number; manufactureDate?: string;
  expiryDate?: string; receivedAt: string; supplier?: string; invoiceCode?: string;
  note?: string; createdBy?: string;
}
export interface StockTransaction {
  id: string; itemId: string; batchId?: string;
  type: 'IMPORT' | 'EXPORT' | 'COUNT' | 'ADJUST_IN' | 'ADJUST_OUT' | 'DISCARD' | 'RETURN';
  quantity: number; stockBefore: number; stockAfter: number; unitCost?: number;
  reason?: string; note?: string; occurredAt: string; createdBy?: string;
}
export interface StockCount {
  id: string; sessionId?: string; itemId: string; systemQuantity: number;
  actualQuantity: number; difference: number; differenceValue: number;
  countedAt: string; countedBy?: string; reason?: string; status: 'DRAFT' | 'CONFIRMED';
}
