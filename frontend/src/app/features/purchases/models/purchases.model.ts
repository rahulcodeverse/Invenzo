export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor?: {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
  };
  orderDate: string;
  expectedDate?: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  receivedQty?: number;
  items: PurchaseOrderItem[];
  notes?: string;
  createdAt: string;
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    unit: { name: string; symbol: string };
  };
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: any;
  receiveDate: string;
  warehouseId: string;
  warehouse?: any;
  status: string;
  items: GRNItem[];
  notes?: string;
}

export interface GRNItem {
  id?: string;
  productId: string;
  product?: any;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendor?: any;
  purchaseOrderId?: string;
  invoiceDate: string;
  dueDate: string;
  status: PurchaseInvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  items: PurchaseInvoiceItem[];
  notes?: string;
}

export enum PurchaseInvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface PurchaseInvoiceItem {
  id?: string;
  productId: string;
  product?: any;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendor?: any;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  invoiceAllocations?: PaymentAllocation[];
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CREDIT_CARD = 'CREDIT_CARD',
  UPI = 'UPI'
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

