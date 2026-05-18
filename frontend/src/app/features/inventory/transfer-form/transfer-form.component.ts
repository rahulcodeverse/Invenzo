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
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { InventoryService } from '../../../core/services/inventory.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { ProductApiService, Product } from '../../products/services/product-api.service';
import { Warehouse } from '../../../core/models/master-data.model';
import { Stock } from '../../../core/models/inventory.model';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-transfer-form',
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
    NzModalModule,
    NzGridModule,
    NzIconModule,
    NzAlertModule,
    NzDividerModule,
    PageHeaderComponent
  ],
  templateUrl: './transfer-form.component.html',
  styleUrls: ['./transfer-form.component.scss']
})
export class TransferFormComponent implements OnInit {
  transferForm!: FormGroup;
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  availableStock: Stock | null = null;
  loading = false;
  saving = false;
  checkingStock = false;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private masterDataService: MasterDataService,
    private productService: ProductApiService,
    private message: NzMessageService,
    private modal: NzModalService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupValueChanges();
  }

  initForm(): void {
    this.transferForm = this.fb.group({
      fromWarehouseId: [null, [Validators.required]],
      toWarehouseId: [null, [Validators.required]],
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.minLength(5)]],
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
          this.warehouses = warehousesData.filter(w => w.isActive);
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

  get fromWarehouseName(): string {
    const warehouseId = this.transferForm.get('fromWarehouseId')?.value;
    return this.warehouses.find(w => w.id === warehouseId)?.name || '';
  }

  get toWarehouseName(): string {
    const warehouseId = this.transferForm.get('toWarehouseId')?.value;
    return this.warehouses.find(w => w.id === warehouseId)?.name || '';
  }

  setupValueChanges(): void {
    // Check stock when product or from warehouse changes
    this.transferForm.get('productId')?.valueChanges.subscribe(() => {
      this.checkAvailableStock();
    });

    this.transferForm.get('fromWarehouseId')?.valueChanges.subscribe(() => {
      this.checkAvailableStock();
      // Reset to warehouse if same as from
      const toWarehouse = this.transferForm.get('toWarehouseId')?.value;
      const fromWarehouse = this.transferForm.get('fromWarehouseId')?.value;
      if (toWarehouse === fromWarehouse) {
        this.transferForm.patchValue({ toWarehouseId: null });
      }
    });
  }

  checkAvailableStock(): void {
    const productId = this.transferForm.get('productId')?.value;
    const warehouseId = this.transferForm.get('fromWarehouseId')?.value;

    if (productId && warehouseId) {
      this.checkingStock = true;
      this.inventoryService.getStock({ productId, warehouseId, limit: 1 }).subscribe({
        next: (response) => {
          if (response.data.length > 0) {
            this.availableStock = response.data[0];
            // Update quantity validator max
            const quantityControl = this.transferForm.get('quantity');
            quantityControl?.setValidators([
              Validators.required,
              Validators.min(1),
              Validators.max(this.availableStock.available)
            ]);
            quantityControl?.updateValueAndValidity();
          } else {
            this.availableStock = null;
            this.message.warning('No stock available in selected warehouse');
          }
          this.checkingStock = false;
        },
        error: () => {
          this.checkingStock = false;
          this.availableStock = null;
        }
      });
    } else {
      this.availableStock = null;
    }
  }

  getToWarehouses(): Warehouse[] {
    const fromId = this.transferForm.get('fromWarehouseId')?.value;
    return this.warehouses.filter(w => w.id !== fromId);
  }

  onSubmit(): void {
    if (this.transferForm.valid && this.availableStock) {
      const quantity = this.transferForm.get('quantity')?.value;

      // Confirm transfer
      this.modal.confirm({
        nzTitle: 'Confirm Transfer',
        nzContent: `Transfer ${quantity} ${this.availableStock.product.unit.symbol} of ${this.availableStock.product.name}?`,
        nzOkText: 'Confirm Transfer',
        nzCancelText: 'Cancel',
        nzOnOk: () => this.executeTransfer()
      });
    } else {
      Object.values(this.transferForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  executeTransfer(): void {
    this.saving = true;
    const formData = this.transferForm.value;

    this.inventoryService.transferStock(formData).subscribe({
      next: () => {
        this.message.success('Stock transferred successfully');
        this.router.navigate(['/inventory/transfers']);
      },
      error: () => {
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/transfers']);
  }

  get canShowPreview(): boolean {
    return this.transferForm.valid && this.availableStock !== null;
  }
}

