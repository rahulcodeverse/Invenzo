import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../../core/models/user.model';
import { PurchaseOrder, GoodsReceivedNote, PurchaseInvoice, VendorPayment } from '../models/purchases.model';

@Injectable({
  providedIn: 'root'
})
export class PurchasesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private normalizePurchaseOrder(order: any): PurchaseOrder {
    return {
      ...order,
      expectedDeliveryDate: order.expectedDeliveryDate ?? order.expectedDate,
      totalAmount: Number(order.totalAmount ?? order.total ?? 0),
      subtotal: Number(order.subtotal ?? 0),
      taxAmount: Number(order.taxAmount ?? 0),
      discount: Number(order.discount ?? 0),
      paidAmount: Number(order.paidAmount ?? 0),
      items: (order.items ?? []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice ?? 0),
        taxRate: Number(item.taxRate ?? 0),
        taxAmount: Number(item.taxAmount ?? 0),
        total: Number(item.total ?? 0),
      })),
    };
  }

  private normalizePurchaseInvoice(invoice: any): PurchaseInvoice {
    const vendor = invoice.vendor ?? invoice.grn?.purchaseOrder?.vendor;
    return {
      ...invoice,
      vendor,
      totalAmount: Number(invoice.totalAmount ?? invoice.total ?? 0),
      subtotal: Number(invoice.subtotal ?? 0),
      taxAmount: Number(invoice.taxAmount ?? 0),
      discount: Number(invoice.discount ?? 0),
      paidAmount: Number(invoice.paidAmount ?? 0),
      balanceAmount: Number(invoice.balanceAmount ?? 0),
      items: (invoice.items ?? invoice.grn?.purchaseOrder?.items ?? []).map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice ?? 0),
        discount: Number(item.discount ?? 0),
        taxRate: Number(item.taxRate ?? 0),
        taxAmount: Number(item.taxAmount ?? 0),
        total: Number(item.total ?? 0),
      })),
    };
  }

  // ==================== PURCHASE ORDERS ====================

  getPurchaseOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    vendorId?: string;
    status?: string;
  }): Observable<PaginatedResponse<PurchaseOrder>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.vendorId) httpParams = httpParams.set('vendorId', params.vendorId);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/purchases/po`, { params: httpParams })
      .pipe(map(res => ({ ...res, data: (res.data ?? []).map(order => this.normalizePurchaseOrder(order)) })));
  }

  getPurchaseOrderById(id: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/purchases/po/${id}`)
      .pipe(map(res => ({ ...res, data: this.normalizePurchaseOrder(res.data) })));
  }

  downloadPurchaseOrderPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/purchases/po/${id}/pdf`, { responseType: 'blob' });
  }

  createPurchaseOrder(po: Partial<PurchaseOrder>): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/purchases/po`, po);
  }

  updatePurchaseOrder(id: string, po: Partial<PurchaseOrder>): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.patch<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/purchases/po/${id}`, po);
  }

  approvePurchaseOrder(id: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/purchases/po/${id}/approve`, {});
  }

  cancelPurchaseOrder(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/purchases/po/${id}/cancel`, {});
  }

  // ==================== GRN ====================

  getGRNs(params?: { page?: number; limit?: number; poId?: string }): Observable<PaginatedResponse<GoodsReceivedNote>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.poId) httpParams = httpParams.set('poId', params.poId);
    }
    return this.http.get<PaginatedResponse<GoodsReceivedNote>>(`${this.apiUrl}/purchases/grn`, { params: httpParams });
  }

  createGRN(grn: Partial<GoodsReceivedNote>): Observable<ApiResponse<GoodsReceivedNote>> {
    return this.http.post<ApiResponse<GoodsReceivedNote>>(`${this.apiUrl}/purchases/grn`, grn);
  }

  // ==================== PURCHASE INVOICES ====================

  getPurchaseInvoices(params?: {
    page?: number;
    limit?: number;
    vendorId?: string;
    status?: string;
  }): Observable<PaginatedResponse<PurchaseInvoice>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.vendorId) httpParams = httpParams.set('vendorId', params.vendorId);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/purchases/invoice`, { params: httpParams })
      .pipe(map(res => ({ ...res, data: (res.data ?? []).map(invoice => this.normalizePurchaseInvoice(invoice)) })));
  }

  getPurchaseInvoiceById(id: string): Observable<ApiResponse<PurchaseInvoice>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/purchases/invoice/${id}`)
      .pipe(map(res => ({ ...res, data: this.normalizePurchaseInvoice(res.data) })));
  }

  downloadPurchaseInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/purchases/invoice/${id}/pdf`, { responseType: 'blob' });
  }

  createPurchaseInvoice(invoice: Partial<PurchaseInvoice>): Observable<ApiResponse<PurchaseInvoice>> {
    return this.http.post<ApiResponse<PurchaseInvoice>>(`${this.apiUrl}/purchases/invoice`, invoice);
  }

  // ==================== VENDOR PAYMENTS ====================

  getVendorPayments(params?: { page?: number; limit?: number; vendorId?: string }): Observable<PaginatedResponse<VendorPayment>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.vendorId) httpParams = httpParams.set('vendorId', params.vendorId);
    }
    return this.http.get<PaginatedResponse<VendorPayment>>(`${this.apiUrl}/purchases/payment`, { params: httpParams });
  }

  createVendorPayment(payment: Partial<VendorPayment>): Observable<ApiResponse<VendorPayment>> {
    return this.http.post<ApiResponse<VendorPayment>>(`${this.apiUrl}/purchases/payment`, payment);
  }
}

