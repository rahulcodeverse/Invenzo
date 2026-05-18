import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../core/models/user.model';
import { Warehouse, Customer, Vendor } from '../../core/models/master-data.model';

@Injectable({
  providedIn: 'root'
})
export class MasterDataService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== WAREHOUSES ====================

  getWarehouses(): Observable<PaginatedResponse<Warehouse>> {
    return this.http.get<PaginatedResponse<Warehouse>>(`${this.apiUrl}/warehouses`);
  }

  getWarehouseById(id: string): Observable<ApiResponse<Warehouse>> {
    return this.http.get<ApiResponse<Warehouse>>(`${this.apiUrl}/warehouses/${id}`);
  }

  createWarehouse(warehouse: Partial<Warehouse>): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${this.apiUrl}/warehouses`, warehouse);
  }

  updateWarehouse(id: string, warehouse: Partial<Warehouse>): Observable<ApiResponse<Warehouse>> {
    return this.http.patch<ApiResponse<Warehouse>>(`${this.apiUrl}/warehouses/${id}`, warehouse);
  }

  deleteWarehouse(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/warehouses/${id}`);
  }

  // ==================== CUSTOMERS ====================

  getCustomers(params?: { page?: number; limit?: number; search?: string }): Observable<PaginatedResponse<Customer>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<PaginatedResponse<Customer>>(`${this.apiUrl}/customers`, { params: httpParams });
  }

  getCustomerById(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/customers/${id}`);
  }

  getCustomerStatement(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/customers/${id}/statement`);
  }

  createCustomer(customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.apiUrl}/customers`, customer);
  }

  updateCustomer(id: string, customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.patch<ApiResponse<Customer>>(`${this.apiUrl}/customers/${id}`, customer);
  }

  deleteCustomer(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/customers/${id}`);
  }

  // ==================== VENDORS ====================

  getVendors(params?: { page?: number; limit?: number; search?: string }): Observable<PaginatedResponse<Vendor>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<PaginatedResponse<Vendor>>(`${this.apiUrl}/vendors`, { params: httpParams });
  }

  getVendorById(id: string): Observable<ApiResponse<Vendor>> {
    return this.http.get<ApiResponse<Vendor>>(`${this.apiUrl}/vendors/${id}`);
  }

  getVendorStatement(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/vendors/${id}/statement`);
  }

  createVendor(vendor: Partial<Vendor>): Observable<ApiResponse<Vendor>> {
    return this.http.post<ApiResponse<Vendor>>(`${this.apiUrl}/vendors`, vendor);
  }

  updateVendor(id: string, vendor: Partial<Vendor>): Observable<ApiResponse<Vendor>> {
    return this.http.patch<ApiResponse<Vendor>>(`${this.apiUrl}/vendors/${id}`, vendor);
  }

  deleteVendor(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/vendors/${id}`);
  }
}

