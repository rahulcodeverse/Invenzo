import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../../core/models/user.model';
import { Quotation, SalesOrder, DeliveryNote, SalesInvoice, CustomerPayment } from '../models/sales.model';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private normalizeQuotation(quotation: any): Quotation {
    return {
      ...quotation,
      totalAmount: Number(quotation.totalAmount ?? quotation.total ?? 0),
      subtotal: Number(quotation.subtotal ?? 0),
      taxAmount: Number(quotation.taxAmount ?? 0),
      discount: Number(quotation.discount ?? 0),
      items: (quotation.items ?? []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0),
        taxRate: Number(item.taxRate ?? 0),
        taxAmount: Number(item.taxAmount ?? 0),
        total: Number(item.total ?? 0)
      }))
    };
  }

  private normalizeOrder(order: any): SalesOrder {
    return {
      ...order,
      orderNumber: order.orderNumber ?? order.soNumber,
      expectedDeliveryDate: order.expectedDeliveryDate ?? order.deliveryDate,
      totalAmount: Number(order.totalAmount ?? order.total ?? 0),
      subtotal: Number(order.subtotal ?? 0),
      taxAmount: Number(order.taxAmount ?? 0),
      discount: Number(order.discount ?? 0),
      paidAmount: Number(order.paidAmount ?? 0),
      items: (order.items ?? []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0),
        taxRate: Number(item.taxRate ?? 0),
        taxAmount: Number(item.taxAmount ?? 0),
        total: Number(item.total ?? 0)
      }))
    };
  }

  private normalizeInvoice(invoice: any): SalesInvoice {
    const customer = invoice.customer ?? invoice.salesOrder?.customer ?? invoice.deliveryNote?.salesOrder?.customer;
    return {
      ...invoice,
      customer,
      totalAmount: Number(invoice.totalAmount ?? invoice.total ?? 0),
      subtotal: Number(invoice.subtotal ?? 0),
      taxAmount: Number(invoice.taxAmount ?? 0),
      discount: Number(invoice.discount ?? 0),
      paidAmount: Number(invoice.paidAmount ?? 0),
      balanceAmount: Number(invoice.balanceAmount ?? 0),
      items: (invoice.items ?? invoice.salesOrder?.items ?? invoice.deliveryNote?.salesOrder?.items ?? []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0),
        taxRate: Number(item.taxRate ?? 0),
        taxAmount: Number(item.taxAmount ?? 0),
        total: Number(item.total ?? 0)
      }))
    };
  }

  private normalizePayment(payment: any): CustomerPayment {
    return {
      ...payment,
      paymentMethod: payment.paymentMethod ?? payment.method,
      amount: Number(payment.amount ?? 0)
    };
  }

  // ==================== QUOTATIONS ====================

  getQuotations(params?: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    status?: string;
  }): Observable<PaginatedResponse<Quotation>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/sales/quotations`, { params: httpParams })
      .pipe(map(res => ({ ...res, data: (res.data ?? []).map(quotation => this.normalizeQuotation(quotation)) })));
  }

  getQuotationById(id: string): Observable<ApiResponse<Quotation>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/sales/quotations/${id}`)
      .pipe(map(res => ({ ...res, data: this.normalizeQuotation(res.data) })));
  }

  downloadQuotationPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sales/quotations/${id}/pdf`, { responseType: 'blob' });
  }

  createQuotation(quotation: Partial<Quotation>): Observable<ApiResponse<Quotation>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/quotations`, quotation)
      .pipe(map(res => ({ ...res, data: this.normalizeQuotation(res.data) })));
  }

  updateQuotation(id: string, quotation: Partial<Quotation>): Observable<ApiResponse<Quotation>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/sales/quotations/${id}`, quotation)
      .pipe(map(res => ({ ...res, data: this.normalizeQuotation(res.data) })));
  }

  deleteQuotation(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/sales/quotations/${id}`);
  }

  convertQuotationToOrder(id: string): Observable<ApiResponse<SalesOrder>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/quotations/${id}/convert`, {})
      .pipe(map(res => ({ ...res, data: this.normalizeOrder(res.data) })));
  }

  // ==================== SALES ORDERS ====================

  getSalesOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    status?: string;
  }): Observable<PaginatedResponse<SalesOrder>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/sales/orders`, { params: httpParams })
      .pipe(map(res => ({ ...res, data: (res.data ?? []).map(order => this.normalizeOrder(order)) })));
  }

  getSalesOrderById(id: string): Observable<ApiResponse<SalesOrder>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/sales/orders/${id}`)
      .pipe(map(res => ({ ...res, data: this.normalizeOrder(res.data) })));
  }

  downloadSalesOrderPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sales/orders/${id}/pdf`, { responseType: 'blob' });
  }

  createSalesOrder(order: Partial<SalesOrder>): Observable<ApiResponse<SalesOrder>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/orders`, {
      ...order,
      deliveryDate: (order as any).deliveryDate ?? (order as any).expectedDeliveryDate
    }).pipe(map(res => ({ ...res, data: this.normalizeOrder(res.data) })));
  }

  updateSalesOrder(id: string, order: Partial<SalesOrder>): Observable<ApiResponse<SalesOrder>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/sales/orders/${id}`, {
      ...order,
      deliveryDate: (order as any).deliveryDate ?? (order as any).expectedDeliveryDate
    }).pipe(map(res => ({ ...res, data: this.normalizeOrder(res.data) })));
  }

  confirmSalesOrder(id: string): Observable<ApiResponse<SalesOrder>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/orders/${id}/confirm`, {})
      .pipe(map(res => ({ ...res, data: this.normalizeOrder(res.data) })));
  }

  cancelSalesOrder(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/orders/${id}/cancel`, {});
  }

  // ==================== DELIVERY NOTES ====================

  getDeliveryNotes(params?: { page?: number; limit?: number; salesOrderId?: string }): Observable<PaginatedResponse<DeliveryNote>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.salesOrderId) httpParams = httpParams.set('salesOrderId', params.salesOrderId);
    }
    return this.http.get<PaginatedResponse<DeliveryNote>>(`${this.apiUrl}/sales/delivery`, { params: httpParams });
  }

  downloadDeliveryChallanPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sales/delivery/${id}/pdf`, { responseType: 'blob' });
  }

  createDeliveryNote(delivery: Partial<DeliveryNote>): Observable<ApiResponse<DeliveryNote>> {
    return this.http.post<ApiResponse<DeliveryNote>>(`${this.apiUrl}/sales/delivery`, delivery);
  }

  // ==================== SALES INVOICES ====================

  getSalesInvoices(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: string;
  }): Observable<PaginatedResponse<SalesInvoice>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/sales/invoice`, { params: httpParams })
      .pipe(map(res => ({ ...res, data: (res.data ?? []).map(invoice => this.normalizeInvoice(invoice)) })));
  }

  getSalesInvoiceById(id: string): Observable<ApiResponse<SalesInvoice>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/sales/invoice/${id}`)
      .pipe(map(res => ({ ...res, data: this.normalizeInvoice(res.data) })));
  }

  downloadSalesInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sales/invoice/${id}/pdf`, { responseType: 'blob' });
  }

  createSalesInvoice(invoice: Partial<SalesInvoice>): Observable<ApiResponse<SalesInvoice>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/invoice`, invoice)
      .pipe(map(res => ({ ...res, data: this.normalizeInvoice(res.data) })));
  }

  // ==================== CUSTOMER PAYMENTS ====================

  getCustomerPayments(params?: { page?: number; limit?: number; customerId?: string }): Observable<PaginatedResponse<CustomerPayment>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/sales/payment`, { params: httpParams })
      .pipe(map(res => ({ ...res, data: (res.data ?? []).map(payment => this.normalizePayment(payment)) })));
  }

  createCustomerPayment(payment: Partial<CustomerPayment>): Observable<ApiResponse<CustomerPayment>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sales/payment`, {
      ...payment,
      method: (payment as any).method ?? (payment as any).paymentMethod
    }).pipe(map(res => ({ ...res, data: this.normalizePayment(res.data?.payment ?? res.data) })));
  }

  downloadCustomerPaymentPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sales/payment/${id}/pdf`, { responseType: 'blob' });
  }
}

