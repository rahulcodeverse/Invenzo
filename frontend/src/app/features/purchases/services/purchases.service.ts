import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../../core/models/user.model';
import { PurchaseOrder, GoodsReceivedNote, PurchaseInvoice, VendorPayment } from '../models/purchases.model';

@Injectable({
  providedIn: 'root'
})
export class PurchasesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

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
    return this.http.get<PaginatedResponse<PurchaseOrder>>(`${this.apiUrl}/purchases/po`, { params: httpParams });
  }

  getPurchaseOrderById(id: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.get<ApiResponse<PurchaseOrder>>(`${this.apiUrl}/purchases/po/${id}`);
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
    return this.http.get<PaginatedResponse<PurchaseInvoice>>(`${this.apiUrl}/purchases/invoice`, { params: httpParams });
  }

  getPurchaseInvoiceById(id: string): Observable<ApiResponse<PurchaseInvoice>> {
    return this.http.get<ApiResponse<PurchaseInvoice>>(`${this.apiUrl}/purchases/invoice/${id}`);
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

