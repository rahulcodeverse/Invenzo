import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ProductApiService, Product, Category, Brand } from '../../services/product-api.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzModalModule,
    NzIconModule,
    NzSpaceModule,
    NzCardModule,
    NzEmptyModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];

  loading = false;
  total = 0;
  pageSize = 20;
  pageIndex = 1;

  searchText = '';
  selectedCategory: string | null = null;
  selectedBrand: string | null = null;
  selectedStatus: boolean | null = null;

  private searchSubject = new Subject<string>();

  constructor(
    private productApi: ProductApiService,
    private router: Router,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(search => {
      this.searchText = search;
      this.pageIndex = 1;
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadFilters();
  }

  loadProducts(): void {
    this.loading = true;

    this.productApi.getProducts({
      page: this.pageIndex,
      limit: this.pageSize,
      search: this.searchText || undefined,
      categoryId: this.selectedCategory || undefined,
      brandId: this.selectedBrand || undefined,
      isActive: this.selectedStatus ?? undefined
    }).subscribe({
      next: (response: any) => {
        // Backend wraps response in { success, data: { data, meta }, timestamp }
        const actualData = response.data || response;
        this.products = actualData.data || [];
        this.total = actualData.meta?.total || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadFilters(): void {
    this.productApi.getCategories().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.categories = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            this.categories = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            this.categories = response.data.data;
          } else {
            this.categories = [];
          }
        } else {
          this.categories = [];
        }
      },
      error: () => {
        this.categories = [];
      }
    });

    this.productApi.getBrands().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.brands = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            this.brands = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            this.brands = response.data.data;
          } else {
            this.brands = [];
          }
        } else {
          this.brands = [];
        }
      },
      error: () => {
        this.brands = [];
      }
    });
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadProducts();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadProducts();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.selectedStatus = null;
    this.pageIndex = 1;
    this.loadProducts();
  }

  navigateToNew(): void {
    this.router.navigate(['/products/new']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/products', id, 'edit']);
  }

  confirmDelete(product: Product): void {
    this.modal.confirm({
      nzTitle: 'Delete Product',
      nzContent: `Are you sure you want to delete "${product.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.deleteProduct(product.id)
    });
  }

  deleteProduct(id: string): void {
    this.productApi.deleteProduct(id).subscribe({
      next: () => {
        this.message.success('Product deleted successfully');
        this.loadProducts();
      }
    });
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '₹0.00';
    }
    return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

