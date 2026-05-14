import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../../core/models/user.model';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  unitId: string;
  barcode?: string;
  images?: string[];
  costPrice: number;
  sellingPrice: number;
  unitPrice?: number; // Alias for sellingPrice
  mrp?: number;
  taxRate?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  minStock?: number; // Alias for minStockLevel
  maxStock?: number; // Alias for maxStockLevel
  reorderPoint?: number; // Alias for reorderLevel
  hasVariants: boolean;
  hasBatch: boolean;
  hasSerial: boolean;
  trackExpiry?: boolean;
  isActive: boolean;
  imageUrl?: string;
  category?: Category;
  brand?: Brand;
  unit?: Unit;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class ProductApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== PRODUCTS ====================

  getProducts(filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.brandId) params = params.set('brandId', filters.brandId);
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/products/${id}`);
  }

  // ==================== CATEGORIES ====================

  getCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/categories/${id}`);
  }

  // ==================== BRANDS ====================

  getBrands(): Observable<PaginatedResponse<Brand>> {
    return this.http.get<PaginatedResponse<Brand>>(`${this.apiUrl}/brands`);
  }

  getBrandById(id: string): Observable<ApiResponse<Brand>> {
    return this.http.get<ApiResponse<Brand>>(`${this.apiUrl}/brands/${id}`);
  }

  createBrand(brand: Partial<Brand>): Observable<ApiResponse<Brand>> {
    return this.http.post<ApiResponse<Brand>>(`${this.apiUrl}/brands`, brand);
  }

  updateBrand(id: string, brand: Partial<Brand>): Observable<ApiResponse<Brand>> {
    return this.http.patch<ApiResponse<Brand>>(`${this.apiUrl}/brands/${id}`, brand);
  }

  deleteBrand(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/brands/${id}`);
  }

  // ==================== UNITS ====================

  getUnits(): Observable<PaginatedResponse<Unit>> {
    return this.http.get<PaginatedResponse<Unit>>(`${this.apiUrl}/units`);
  }

  getUnitById(id: string): Observable<ApiResponse<Unit>> {
    return this.http.get<ApiResponse<Unit>>(`${this.apiUrl}/units/${id}`);
  }

  createUnit(unit: Partial<Unit>): Observable<ApiResponse<Unit>> {
    return this.http.post<ApiResponse<Unit>>(`${this.apiUrl}/units`, unit);
  }

  updateUnit(id: string, unit: Partial<Unit>): Observable<ApiResponse<Unit>> {
    return this.http.patch<ApiResponse<Unit>>(`${this.apiUrl}/units/${id}`, unit);
  }

  deleteUnit(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/units/${id}`);
  }
}

