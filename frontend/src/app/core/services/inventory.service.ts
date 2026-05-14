import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../models/user.model';
import { Stock, StockMovement, Batch, StockAdjustment, StockTransfer } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== STOCK ====================

  getStock(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    warehouseId?: string;
    lowStock?: boolean;
  }): Observable<PaginatedResponse<Stock>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.productId) httpParams = httpParams.set('productId', params.productId);
      if (params.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
      if (params.lowStock !== undefined) httpParams = httpParams.set('lowStock', params.lowStock.toString());
    }
    return this.http.get<PaginatedResponse<Stock>>(`${this.apiUrl}/inventory/stock`, { params: httpParams });
  }

  // ==================== STOCK MOVEMENTS ====================

  getMovements(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    warehouseId?: string;
    type?: string;
  }): Observable<PaginatedResponse<StockMovement>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.productId) httpParams = httpParams.set('productId', params.productId);
      if (params.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
      if (params.type) httpParams = httpParams.set('type', params.type);
    }
    return this.http.get<PaginatedResponse<StockMovement>>(`${this.apiUrl}/inventory/movements`, { params: httpParams });
  }

  // ==================== STOCK ADJUSTMENTS ====================

  adjustStock(adjustment: StockAdjustment): Observable<ApiResponse<StockMovement>> {
    return this.http.post<ApiResponse<StockMovement>>(`${this.apiUrl}/inventory/adjust`, adjustment);
  }

  stockIn(data: { productId: string; warehouseId: string; quantity: number; reason?: string; batchNumber?: string }): Observable<ApiResponse<StockMovement>> {
    return this.http.post<ApiResponse<StockMovement>>(`${this.apiUrl}/inventory/in`, data);
  }

  stockOut(data: { productId: string; warehouseId: string; quantity: number; reason?: string; batchNumber?: string }): Observable<ApiResponse<StockMovement>> {
    return this.http.post<ApiResponse<StockMovement>>(`${this.apiUrl}/inventory/out`, data);
  }

  // ==================== STOCK TRANSFERS ====================

  getTransfers(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.productId) httpParams = httpParams.set('productId', params.productId);
      if (params.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
      if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);
    }
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/inventory/transfers`, { params: httpParams });
  }

  transferStock(transfer: StockTransfer): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/inventory/transfer`, transfer);
  }

  // ==================== BATCHES ====================

  getBatches(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    warehouseId?: string;
    expiring?: boolean;
  }): Observable<PaginatedResponse<Batch>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.productId) httpParams = httpParams.set('productId', params.productId);
      if (params.warehouseId) httpParams = httpParams.set('warehouseId', params.warehouseId);
      if (params.expiring !== undefined) httpParams = httpParams.set('expiring', params.expiring.toString());
    }
    return this.http.get<PaginatedResponse<Batch>>(`${this.apiUrl}/inventory/batches`, { params: httpParams });
  }
}

