import { Product } from '../../../products/services/product-api.service';
import { Warehouse } from '../../../../core/models/master-data.model';
import { User } from '../../../../core/models/user.model';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE'
}

export enum ReferenceType {
  INVOICE = 'INVOICE',
  GRN = 'GRN',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  SALES_ORDER = 'SALES_ORDER',
  PURCHASE_ORDER = 'PURCHASE_ORDER'
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reference?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;

  // Populated relations
  product?: Product;
  warehouse?: Warehouse;
  user?: User;
}

export interface MovementFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  productId?: string;
  warehouseId?: string;
  type?: MovementType;
  userId?: string;
  referenceNo?: string;
  minQuantity?: number;
  maxQuantity?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MovementSummary {
  openingStock: number;
  totalIn: number;
  totalOut: number;
  totalTransferIn: number;
  totalTransferOut: number;
  totalAdjustment: number;
  totalDamage: number;
  closingStock: number;
  movementCount: number;
}

export interface MovementExportData {
  date: string;
  product: string;
  warehouse: string;
  type: string;
  quantity: string;
  balanceAfter: number;
  reference: string;
  user: string;
  reason: string;
}

// Type color mapping
export const MOVEMENT_TYPE_CONFIG = {
  [MovementType.IN]: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
    label: 'Stock In',
    icon: 'arrow-down'
  },
  [MovementType.OUT]: {
    color: '#ff4d4f',
    bgColor: '#fff2f0',
    borderColor: '#ffccc7',
    label: 'Stock Out',
    icon: 'arrow-up'
  },
  [MovementType.TRANSFER]: {
    color: '#1890ff',
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
    label: 'Transfer',
    icon: 'swap'
  },
  [MovementType.ADJUSTMENT]: {
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
    label: 'Adjustment',
    icon: 'edit'
  },
  [MovementType.DAMAGE]: {
    color: '#8c8c8c',
    bgColor: '#fafafa',
    borderColor: '#d9d9d9',
    label: 'Damage/Loss',
    icon: 'warning'
  }
};
