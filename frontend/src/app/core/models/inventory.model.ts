export interface Stock {
  id: string;
  productId: string;
  warehouseId: string;
  available: number;
  reserved: number;
  total: number;
  reorderPoint?: number;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: { name: string; symbol: string };
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  batchNumber?: string;
  serialNumber?: string;
  createdAt: string;
  createdBy: string;
  product?: {
    name: string;
    sku: string;
  };
  warehouse?: {
    name: string;
  };
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE'
}

export interface Batch {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  quantity: number;
  manufactureDate?: string;
  expiryDate?: string;
  isActive: boolean;
  product?: {
    name: string;
    sku: string;
  };
}

export interface StockAdjustment {
  productId: string;
  warehouseId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE';
  quantity: number;
  reason: string;
  batchNumber?: string;
}

export interface StockTransfer {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
  batchNumber?: string;
}

