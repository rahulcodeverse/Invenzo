import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { ProductApiService } from '../../products/services/product-api.service';
import { Stock } from '../../../core/models/inventory.model';
import { Warehouse } from '../../../core/models/master-data.model';
import { Product } from '../../products/services/product-api.service';

@Component({
  selector: 'app-stock-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule,
    NzSpaceModule,
    NzBadgeModule,
    NzSwitchModule
  ],
  templateUrl: './stock-overview.component.html',
  styleUrls: ['./stock-overview.component.scss']
})
export class StockOverviewComponent implements OnInit {
  stocks: Stock[] = [];
  warehouses: Warehouse[] = [];
  products: Product[] = [];

  loading = false;
  total = 0;
  pageSize = 20;
  pageIndex = 1;

  selectedWarehouse: string | null = null;
  selectedProduct: string | null = null;
  showLowStockOnly = false;
  activeStockFilter: 'all' | 'low' | 'reserved' | 'out' = 'all';

  constructor(
    private inventoryService: InventoryService,
    private masterDataService: MasterDataService,
    private productService: ProductApiService
  ) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadStock();
  }

  loadFilters(): void {
    // Load warehouses
    this.masterDataService.getWarehouses().subscribe({
      next: (response) => {
        this.warehouses = Array.isArray(response.data) ? response.data : [];
      },
      error: (error) => {
        console.error('Error loading warehouses:', error);
        this.warehouses = [];
      }
    });

    // Load products for filter
    this.productService.getProducts({ limit: 100 }).subscribe({
      next: (response) => {
        this.products = Array.isArray(response.data) ? response.data : [];
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products = [];
      }
    });
  }

  get totalStock(): number {
    return this.stocks.reduce((sum, s) => sum + this.getTotalStock(s), 0);
  }

  get totalAvailable(): number {
    return this.stocks.reduce((sum, s) => sum + (s.available || 0), 0);
  }

  get totalReserved(): number {
    return this.stocks.reduce((sum, s) => sum + (s.reserved || 0), 0);
  }

  get lowStockCount(): number {
    return this.stocks.filter(stock => this.isLowStock(stock)).length;
  }

  get reservedStockCount(): number {
    return this.stocks.filter(stock => (stock.reserved || 0) > 0).length;
  }

  get outOfStockCount(): number {
    return this.stocks.filter(stock => (stock.available || 0) === 0).length;
  }

  loadStock(): void {
    this.loading = true;

    this.inventoryService.getStock({
      page: this.pageIndex,
      limit: this.pageSize,
      warehouseId: this.selectedWarehouse || undefined,
      productId: this.selectedProduct || undefined,
      lowStock: this.showLowStockOnly || undefined
    }).subscribe({
      next: (response) => {
        const rows = Array.isArray(response.data) ? response.data : [];
        this.stocks = rows.map(stock => this.normalizeStock(stock));
        this.total = response.meta?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stock:', error);
        this.stocks = [];
        this.total = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadStock();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadStock();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadStock();
  }

  resetFilters(): void {
    this.selectedWarehouse = null;
    this.selectedProduct = null;
    this.showLowStockOnly = false;
    this.pageIndex = 1;
    this.activeStockFilter = 'all';
    this.loadStock();
  }

  isLowStock(stock: Stock): boolean {
    const reorderPoint = this.getReorderPoint(stock);
    return reorderPoint > 0 ? stock.available <= reorderPoint : false;
  }

  getStockStatus(stock: Stock): { color: string; text: string } {
    if (stock.available === 0) {
      return { color: 'red', text: 'Out of Stock' };
    } else if (this.isLowStock(stock)) {
      return { color: 'orange', text: 'Low Stock' };
    } else {
      return { color: 'default', text: 'In Stock' };
    }
  }

  setStockFilter(filter: 'all' | 'low' | 'reserved' | 'out'): void {
    this.activeStockFilter = filter;
    this.showLowStockOnly = filter === 'low';
    this.loadStock();
  }

  get displayedStocks(): Stock[] {
    if (this.activeStockFilter === 'reserved') {
      return this.stocks.filter(stock => (stock.reserved || 0) > 0);
    }
    if (this.activeStockFilter === 'out') {
      return this.stocks.filter(stock => (stock.available || 0) === 0);
    }
    return this.stocks;
  }

  getReorderPoint(stock: Stock): number {
    return Number(stock.reorderPoint ?? stock.product?.minStockLevel ?? 0);
  }

  getSuggestedOrderQty(stock: Stock): number {
    const maxStock = Number(stock.product?.maxStockLevel ?? 0);
    const reorderPoint = this.getReorderPoint(stock);
    const target = maxStock > 0 ? maxStock : reorderPoint * 2;
    return Math.max(target - (stock.available || 0), 0);
  }

  getTotalStock(stock: Stock): number {
    return Number(stock.total ?? stock.quantity ?? 0);
  }

  getReservationPercent(stock: Stock): number {
    const total = this.getTotalStock(stock);
    return total > 0 ? Math.round(((stock.reserved || 0) / total) * 100) : 0;
  }

  private normalizeStock(stock: any): Stock {
    return {
      ...stock,
      total: Number(stock.total ?? stock.quantity ?? 0),
      available: Number(stock.available ?? 0),
      reserved: Number(stock.reserved ?? 0),
      reorderPoint: Number(stock.reorderPoint ?? stock.product?.minStockLevel ?? 0),
    };
  }
}

