export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
  };
  quotationDate: string;
  validUntil: string;
  status: QuotationStatus;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  items: QuotationItem[];
  notes?: string;
  termsConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED'
}

export interface QuotationItem {
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
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: any;
  quotationId?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: SalesOrderStatus;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  items: SalesOrderItem[];
  deliveredQty?: number;
  notes?: string;
  createdAt: string;
}

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface SalesOrderItem {
  id?: string;
  productId: string;
  product?: any;
  quantity: number;
  deliveredQty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrder?: any;
  warehouseId?: string;
  warehouse?: any;
  deliveryDate: string;
  status: string;
  items: DeliveryItem[];
  notes?: string;
}

export interface DeliveryItem {
  id?: string;
  productId: string;
  product?: any;
  quantity: number;
  batchNumber?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: any;
  salesOrderId?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  items: InvoiceItem[];
  notes?: string;
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface InvoiceItem {
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

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customer?: any;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
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

