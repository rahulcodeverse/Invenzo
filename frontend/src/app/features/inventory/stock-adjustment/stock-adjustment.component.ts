import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { InventoryService } from '../../../core/services/inventory.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { ProductApiService, Product } from '../../products/services/product-api.service';
import { Warehouse } from '../../../core/models/master-data.model';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzInputNumberModule,
    NzGridModule,
    NzIconModule,
    NzAlertModule
  ],
  templateUrl: './stock-adjustment.component.html',
  styleUrls: ['./stock-adjustment.component.scss']
})
export class StockAdjustmentComponent implements OnInit {
  adjustmentForm!: FormGroup;
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  loading = false;
  saving = false;

  adjustmentTypes = [
    { label: 'Stock In', value: 'IN', icon: 'arrow-up', color: 'green' },
    { label: 'Stock Out', value: 'OUT', icon: 'arrow-down', color: 'red' },
    { label: 'Adjustment', value: 'ADJUSTMENT', icon: 'sync', color: 'blue' },
    { label: 'Damage/Loss', value: 'DAMAGE', icon: 'warning', color: 'orange' }
  ];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private masterDataService: MasterDataService,
    private productService: ProductApiService,
    private message: NzMessageService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  initForm(): void {
    this.adjustmentForm = this.fb.group({
      type: ['IN', [Validators.required]],
      productId: [null, [Validators.required]],
      warehouseId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(3)]],
      batchNumber: ['']
    });
  }

  loadData(): void {
    this.loading = true;

    // Load products
    this.productService.getProducts({ limit: 100 }).subscribe({
      next: (response: any) => {
        // Handle API response structure: response.data.data (success wrapper + PaginatedResponse)
        const productsData = response?.data?.data || response?.data || [];
        if (Array.isArray(productsData)) {
          this.products = productsData;
        } else {
          this.products = [];
          console.error('Invalid products response structure:', response);
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products = [];
      }
    });

    // Load warehouses
    this.masterDataService.getWarehouses().subscribe({
      next: (response: any) => {
        // Handle API response structure: response.data.data (success wrapper + PaginatedResponse)
        const warehousesData = response?.data?.data || response?.data || [];
        if (Array.isArray(warehousesData)) {
          this.warehouses = warehousesData;
        } else {
          this.warehouses = [];
          console.error('Invalid warehouses response structure:', response);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading warehouses:', error);
        this.warehouses = [];
        this.loading = false;
      }
    });
  }

  get selectedProductName(): string {
    const productId = this.adjustmentForm.get('productId')?.value;
    return this.products.find(p => p.id === productId)?.name || '-';
  }

  get selectedWarehouseName(): string {
    const warehouseId = this.adjustmentForm.get('warehouseId')?.value;
    return this.warehouses.find(w => w.id === warehouseId)?.name || '-';
  }

  onSubmit(): void {
    if (this.adjustmentForm.valid) {
      this.saving = true;
      const formData = this.adjustmentForm.value;

      this.inventoryService.adjustStock(formData).subscribe({
        next: () => {
          this.message.success('Stock adjustment recorded successfully');
          this.router.navigate(['/inventory/stock']);
        },
        error: () => {
          this.saving = false;
        },
        complete: () => {
          this.saving = false;
        }
      });
    } else {
      Object.values(this.adjustmentForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/inventory/stock']);
  }

  get selectedType() {
    const type = this.adjustmentForm.get('type')?.value;
    return this.adjustmentTypes.find(t => t.value === type);
  }
}

