import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// NG-Zorro Imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAlertModule } from 'ng-zorro-antd/alert';

// Services
import { InventoryMovementService } from '../services/inventory-movement.service';
import { MovementExportService } from '../services/movement-export.service';
import { ProductApiService, Product } from '../../../products/services/product-api.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { AuthService } from '../../../../core/services/auth.service';

// Models
import {
  StockMovement,
  MovementType,
  MovementFilters,
  MovementSummary,
  MOVEMENT_TYPE_CONFIG
} from '../models/movement.model';
import { Warehouse } from '../../../../core/models/master-data.model';
import { format } from 'date-fns';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    NzBadgeModule,
    NzSpaceModule,
    NzDropDownModule,
    NzModalModule,
    NzEmptyModule,
    NzSpinModule,
    NzStatisticModule,
    NzGridModule,
    NzDividerModule,
    NzToolTipModule,
    NzAlertModule
  ],
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.scss']
})
export class MovementListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Data
  movements: StockMovement[] = [];
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  summary: MovementSummary | null = null;
  selectedMovement: StockMovement | null = null;
  detailsVisible = false;

  // Pagination
  pageIndex = 1;
  pageSize = 20;
  total = 0;

  // Loading states
  loading = false;
  loadingSummary = false;
  loadingProducts = false;
  loadingWarehouses = false;
  exporting = false;

  // Filters
  filters: MovementFilters = {
    page: 1,
    limit: 20
  };
  dateRange: Date[] = [];
  searchText = '';
  showFilters = false;

  // Movement types for dropdown
  movementTypes = Object.values(MovementType);
  movementTypeConfig = MOVEMENT_TYPE_CONFIG;

  // RBAC
  canExport = false;
  canViewCost = false;

  // Table columns visibility
  visibleColumns = {
    date: true,
    product: true,
    warehouse: true,
    type: true,
    quantity: true,
    reference: true,
    notes: true,
    user: true,
    actions: true
  };

  constructor(
    private movementService: InventoryMovementService,
    private exportService: MovementExportService,
    private productService: ProductApiService,
    private masterDataService: MasterDataService,
    private authService: AuthService,
    private message: NzMessageService,
    private modal: NzModalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkPermissions();
    this.setupSearch();
    this.loadFiltersFromURL();
    this.loadProducts();
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check user permissions
   */
  checkPermissions(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.canExport = ['OWNER', 'MANAGER'].includes(user.role);
        this.canViewCost = ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(user.role);
      }
    });
  }

  /**
   * Load initial data
   */
  loadInitialData(): void {
    this.loadMovements();
    this.loadSummary();
    this.loadProducts();
    this.loadWarehouses();
  }

  /**
   * Load movements from API
   */
  loadMovements(): void {
    this.loading = true;

    this.filters.page = this.pageIndex;
    this.filters.limit = this.pageSize;

    this.movementService
      .getMovements(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Handle response structure
          const data = response?.data?.data || response?.data || [];
          const meta = response?.data?.meta || response?.meta || {};

          this.movements = Array.isArray(data) ? data : [];
          this.total = meta.total || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading movements:', error);
          this.message.error('Failed to load inventory movements');
          this.movements = [];
          this.total = 0;
          this.loading = false;
        }
      });
  }

  /**
   * Load summary statistics
   */
  loadSummary(): void {
    this.loadingSummary = true;

    this.movementService
      .getMovementSummary(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.loadingSummary = false;
        },
        error: (error) => {
          // If summary endpoint doesn't exist (404), set default values
          if (error.status === 404) {
            this.summary = {
              openingStock: 0,
              totalIn: 0,
              totalOut: 0,
              totalTransferIn: 0,
              totalTransferOut: 0,
              totalAdjustment: 0,
              totalDamage: 0,
              closingStock: 0,
              movementCount: 0
            };
          } else {
            console.error('Error loading summary:', error);
          }
          this.loadingSummary = false;
        }
      });
  }

  /**
   * Load products for filter dropdown
   */
  loadProducts(): void {
    this.loadingProducts = true;

    this.productService
      .getProducts({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data?.data || response?.data || [];
          this.products = Array.isArray(data) ? data : [];
          this.loadingProducts = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loadingProducts = false;
        }
      });
  }

  /**
   * Load warehouses for filter dropdown
   */
  loadWarehouses(): void {
    this.loadingWarehouses = true;

    this.masterDataService
      .getWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const data = response?.data?.data || response?.data || [];
          this.warehouses = Array.isArray(data) ? data : [];
          this.loadingWarehouses = false;
        },
        error: (error) => {
          console.error('Error loading warehouses:', error);
          this.loadingWarehouses = false;
        }
      });
  }

  /**
   * Setup search with debounce
   */
  setupSearch(): void {
    this.searchSubject$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchText) => {
        this.filters.search = searchText;
        this.pageIndex = 1;
        this.loadMovements();
        this.updateURL();
      });
  }

  /**
   * Handle search input
   */
  onSearch(value: string): void {
    this.searchSubject$.next(value);
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    // Convert date range to ISO strings
    if (this.dateRange && this.dateRange.length === 2) {
      this.filters.startDate = this.dateRange[0].toISOString();
      this.filters.endDate = this.dateRange[1].toISOString();
    } else {
      delete this.filters.startDate;
      delete this.filters.endDate;
    }

    this.pageIndex = 1;
    this.loadMovements();
    this.loadSummary();
    this.updateURL();
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.filters = { page: 1, limit: 20 };
    this.dateRange = [];
    this.searchText = '';
    this.pageIndex = 1;
    this.loadMovements();
    this.loadSummary();
    this.updateURL();
  }

  /**
   * Toggle filter panel
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Pagination change
   */
  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadMovements();
    this.updateURL();
  }

  /**
   * Page size change
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.filters.limit = size;
    this.loadMovements();
    this.updateURL();
  }

  /**
   * View movement details (will open modal)
   */
  viewDetails(movement: StockMovement): void {
    this.selectedMovement = movement;
    this.detailsVisible = true;
  }

  /**
   * Export to CSV
   */
  exportCSV(): void {
    if (!this.canExport) {
      this.message.warning('You do not have permission to export data');
      return;
    }

    this.exporting = true;
    this.exportService.downloadCSV(this.movements);
    this.message.success('Movements exported to CSV');
    this.exporting = false;
  }

  /**
   * Export to Excel (using backend API)
   */
  exportExcel(): void {
    if (!this.canExport) {
      this.message.warning('You do not have permission to export data');
      return;
    }

    this.exporting = true;
    this.movementService
      .exportMovementsExcel(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.exportService.downloadExcel(blob);
          this.message.success('Movements exported to Excel');
          this.exporting = false;
        },
        error: (error) => {
          console.error('Export error:', error);
          this.message.error('Failed to export movements');
          this.exporting = false;
        }
      });
  }

  /**
   * Print movements
   */
  printMovements(): void {
    this.exportService.printMovements(this.movements);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  }

  /**
   * Format quantity with sign and color
   */
  formatQuantity(quantity: number): string {
    return quantity >= 0 ? `+${quantity}` : quantity.toString();
  }

  /**
   * Get quantity color class
   */
  getQuantityClass(quantity: number): string {
    return quantity >= 0 ? 'text-success' : 'text-danger';
  }

  /**
   * Get movement type config
   */
  getTypeConfig(type: MovementType) {
    return this.movementTypeConfig[type];
  }

  /**
   * Load filters from URL query params
   */
  loadFiltersFromURL(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.filters = { page: this.pageIndex, limit: this.pageSize };
        if (params['page']) this.pageIndex = +params['page'];
        if (params['limit']) this.pageSize = +params['limit'];
        if (params['productId']) this.filters.productId = params['productId'];
        if (params['warehouseId']) this.filters.warehouseId = params['warehouseId'];
        if (params['type']) this.filters.type = params['type'];
        if (params['search']) this.searchText = params['search'];
        this.filters.page = this.pageIndex;
        this.filters.limit = this.pageSize;
        this.loadMovements();
        this.loadSummary();
      });
  }

  /**
   * Update URL with current filters
   */
  updateURL(): void {
    const queryParams: any = {
      page: this.pageIndex,
      limit: this.pageSize
    };

    if (this.filters.productId) queryParams.productId = this.filters.productId;
    if (this.filters.warehouseId) queryParams.warehouseId = this.filters.warehouseId;
    if (this.filters.type) queryParams.type = this.filters.type;
    if (this.searchText) queryParams.search = this.searchText;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
}
