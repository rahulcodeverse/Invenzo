import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, shareReplay, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../../../core/models/user.model';
import { StockMovement, MovementFilters, MovementSummary } from '../models/movement.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementService {
  private apiUrl = environment.apiUrl;
  private filtersSubject = new BehaviorSubject<MovementFilters>({});

  // Cache for movements (5 min TTL)
  private cache$ = new Map<string, { data: Observable<any>, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get current filters as observable
   */
  get filters$(): Observable<MovementFilters> {
    return this.filtersSubject.asObservable();
  }

  /**
   * Get current filter values
   */
  get currentFilters(): MovementFilters {
    return this.filtersSubject.value;
  }

  /**
   * Update filters
   */
  setFilters(filters: MovementFilters): void {
    this.filtersSubject.next(filters);
    this.clearCache(); // Clear cache when filters change
  }

  /**
   * Reset filters to default
   */
  resetFilters(): void {
    this.filtersSubject.next({ page: 1, limit: 20 });
    this.clearCache();
  }

  /**
   * Get stock movements with filters and pagination
   * Full filter support enabled - backend updated!
   */
  getMovements(filters?: MovementFilters): Observable<PaginatedResponse<StockMovement>> {
    let params = new HttpParams();

    // Send all supported parameters
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.productId) params = params.set('productId', filters.productId);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.referenceNo) params = params.set('referenceNo', filters.referenceNo);
      if (filters.minQuantity !== undefined) params = params.set('minQuantity', filters.minQuantity.toString());
      if (filters.maxQuantity !== undefined) params = params.set('maxQuantity', filters.maxQuantity.toString());
    }

    const cacheKey = params.toString();
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<any>(`${this.apiUrl}/inventory/movements`, { params })
      .pipe(
        map(response => {
          // Handle API response structure: response.data contains PaginatedResponse
          if (response?.data) {
            return response.data;
          }
          return response;
        }),
        shareReplay(1)
      );

    this.setCache(cacheKey, request$);
    return request$;
  }

  /**
   * Get single movement by ID
   */
  getMovementById(id: string): Observable<StockMovement> {
    const cacheKey = `movement-${id}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<StockMovement>>(`${this.apiUrl}/inventory/movements/${id}`)
      .pipe(
        map(response => response.data),
        shareReplay(1)
      );

    this.setCache(cacheKey, request$);
    return request$;
  }

  /**
   * Get movement summary for date range
   */
  getMovementSummary(filters?: MovementFilters): Observable<MovementSummary> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.productId) params = params.set('productId', filters.productId);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    }

    return this.http
      .get<ApiResponse<MovementSummary>>(`${this.apiUrl}/inventory/movements/summary`, { params })
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Export movements as CSV
   */
  exportMovementsCSV(filters?: MovementFilters): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.productId) params = params.set('productId', filters.productId);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.referenceNo) params = params.set('referenceNo', filters.referenceNo);
    }

    return this.http.get(`${this.apiUrl}/inventory/movements/export/csv`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Export movements as Excel
   */
  exportMovementsExcel(filters?: MovementFilters): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.productId) params = params.set('productId', filters.productId);
      if (filters.warehouseId) params = params.set('warehouseId', filters.warehouseId);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.referenceNo) params = params.set('referenceNo', filters.referenceNo);
    }

    return this.http.get(`${this.apiUrl}/inventory/movements/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): Observable<any> | null {
    const cached = this.cache$.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: Observable<any>): void {
    this.cache$.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache$.clear();
  }

  /**
   * Save filter preset to session storage
   */
  saveFilterPreset(name: string, filters: MovementFilters): void {
    const presets = this.getFilterPresets();
    presets[name] = filters;
    sessionStorage.setItem('movement-filter-presets', JSON.stringify(presets));
  }

  /**
   * Get all filter presets
   */
  getFilterPresets(): Record<string, MovementFilters> {
    const stored = sessionStorage.getItem('movement-filter-presets');
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Delete filter preset
   */
  deleteFilterPreset(name: string): void {
    const presets = this.getFilterPresets();
    delete presets[name];
    sessionStorage.setItem('movement-filter-presets', JSON.stringify(presets));
  }
}
