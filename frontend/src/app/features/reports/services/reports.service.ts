import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // KPI
  getSummaryKpis(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/kpi/summary`);
  }

  getFinanceKpis(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${this.apiUrl}/reports/kpi/finance`, { params });
  }

  getInventoryKpis(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/kpi/inventory`);
  }

  getTopProducts(limit = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/kpi/top-products`, { params: new HttpParams().set('limit', limit) });
  }

  getTopCustomers(limit = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/kpi/top-customers`, { params: new HttpParams().set('limit', limit) });
  }

  getTopVendors(limit = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/kpi/top-vendors`, { params: new HttpParams().set('limit', limit) });
  }

  // Sales Analytics
  getSalesTrend(fromDate?: string, toDate?: string, groupBy = 'day'): Observable<any> {
    let params = new HttpParams().set('groupBy', groupBy);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${this.apiUrl}/reports/sales/trend`, { params });
  }

  getProductWiseSales(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${this.apiUrl}/reports/sales/products`, { params });
  }

  getCategoryWiseSales(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${this.apiUrl}/reports/sales/categories`, { params });
  }

  getCustomerWiseSales(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${this.apiUrl}/reports/sales/customers`, { params });
  }

  getSalesGrowth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/sales/growth`);
  }

  // Inventory Analytics
  getStockAgeing(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/inventory/ageing`);
  }

  getDeadStock(days = 90): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/inventory/dead-stock`, { params: new HttpParams().set('daysSinceLastMovement', days) });
  }

  getReorderSuggestions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/inventory/reorder`);
  }

  getBatchExpiryReport(days = 30): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/inventory/expiry`, { params: new HttpParams().set('daysUntilExpiry', days) });
  }

  getWarehouseWiseStock(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/inventory/warehouse-wise`);
  }

  getStockTurnover(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${this.apiUrl}/reports/inventory/turnover`, { params });
  }
}
