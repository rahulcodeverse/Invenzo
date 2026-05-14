import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { ProductApiService, Product } from '../../../products/services/product-api.service';
import { Customer } from '../../../../core/models/master-data.model';

@Component({
  selector: 'app-sales-order-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule,
    NzSelectModule, NzButtonModule, NzInputNumberModule, NzDatePickerModule,
    NzGridModule, NzIconModule, NzDividerModule, NzTableModule, NzAlertModule, NzTagModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <h2>{{ isEditMode ? 'View' : 'New' }} Sales Order</h2>
        <p *ngIf="fromQuotation">Created from Quotation: {{ fromQuotation }}</p>
      </div>

      <nz-alert *ngIf="!isEditMode" nzType="info" nzMessage="Sales Order"
                nzDescription="Create sales order from scratch or convert from quotation. Stock will be reserved on confirmation."
                nzShowIcon style="margin-bottom: 24px;"></nz-alert>

      <form nz-form [formGroup]="orderForm" (ngSubmit)="onSubmit()" nzLayout="vertical">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Customer</nz-form-label>
              <nz-form-control nzErrorTip="Please select customer">
                <nz-select formControlName="customerId" nzShowSearch nzPlaceHolder="Select customer"
                          [nzDisabled]="isEditMode">
                  <nz-option *ngFor="let c of customers" [nzLabel]="c.name" [nzValue]="c.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Order Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="orderDate" style="width: 100%;" [nzDisabled]="isEditMode"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label>Expected Delivery</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="expectedDeliveryDate" style="width: 100%;" [nzDisabled]="isEditMode"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-divider nzText="Order Items"></nz-divider>

        <nz-table [nzData]="items.controls" [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th nzWidth="35%">Product</th>
              <th nzWidth="12%">Qty</th>
              <th nzWidth="12%">Price</th>
              <th nzWidth="10%">Discount %</th>
              <th nzWidth="12%">Total</th>
              <th nzWidth="12%" *ngIf="isEditMode">Delivered</th>
              <th nzWidth="5%" *ngIf="!isEditMode"></th>
            </tr>
          </thead>
          <tbody formArrayName="items">
            <tr *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
              <td>
                <nz-select formControlName="productId" nzShowSearch nzPlaceHolder="Select product"
                          (ngModelChange)="onProductChange(i)" style="width: 100%;" [nzDisabled]="isEditMode">
                  <nz-option *ngFor="let p of products" [nzLabel]="p.name + ' (' + p.sku + ')'" [nzValue]="p.id"></nz-option>
                </nz-select>
              </td>
              <td>
                <nz-input-number formControlName="quantity" [nzMin]="1" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isEditMode"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="unitPrice" [nzMin]="0" [nzStep]="0.01" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isEditMode"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="discount" [nzMin]="0" [nzMax]="100" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isEditMode"></nz-input-number>
              </td>
              <td><strong>₹{{ item.get('total')?.value?.toLocaleString() || 0 }}</strong></td>
              <td *ngIf="isEditMode">
                <nz-tag [nzColor]="item.get('deliveredQty')?.value >= item.get('quantity')?.value ? 'green' : 'orange'">
                  {{ item.get('deliveredQty')?.value || 0 }} / {{ item.get('quantity')?.value }}
                </nz-tag>
              </td>
              <td *ngIf="!isEditMode">
                <button nz-button nzSize="small" nzDanger (click)="removeItem(i)" type="button">
                  <span nz-icon nzType="delete"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <button *ngIf="!isEditMode" nz-button nzType="dashed" (click)="addItem()" type="button"
                style="margin-top: 8px; width: 100%;">
          <span nz-icon nzType="plus"></span> Add Item
        </button>

        <nz-divider></nz-divider>

        <div class="totals-section">
          <div class="total-row"><span>Subtotal:</span><strong>₹{{ subtotal.toLocaleString() }}</strong></div>
          <div class="total-row"><span>Discount:</span><strong>₹{{ totalDiscount.toLocaleString() }}</strong></div>
          <div class="total-row"><span>Tax (18%):</span><strong>₹{{ taxAmount.toLocaleString() }}</strong></div>
          <div class="total-row grand"><span>Grand Total:</span><strong>₹{{ grandTotal.toLocaleString() }}</strong></div>
        </div>

        <nz-form-item>
          <nz-form-label>Notes</nz-form-label>
          <nz-form-control>
            <textarea nz-input formControlName="notes" [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                      [disabled]="isEditMode"></textarea>
          </nz-form-control>
        </nz-form-item>

        <div class="form-actions">
          <button nz-button nzType="default" (click)="onCancel()">Back</button>
          <button *ngIf="!isEditMode" nz-button nzType="primary" type="submit" [nzLoading]="saving"
                  [disabled]="!orderForm.valid">
            Create Sales Order
          </button>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .page-header p { margin: 4px 0 0; color: rgba(0, 0, 0, 0.45); }
    .totals-section { max-width: 400px; margin-left: auto; margin-top: 16px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.grand { border-top: 2px solid #d9d9d9; margin-top: 8px; padding-top: 12px; font-size: 18px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; }
  `]
})
export class SalesOrderFormComponent implements OnInit {
  orderForm!: FormGroup;
  customers: Customer[] = [];
  products: Product[] = [];
  isEditMode = false;
  orderId: string | null = null;
  fromQuotation: string | null = null;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
    private masterDataService: MasterDataService,
    private productService: ProductApiService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.isEditMode = true;
      this.loadOrder(this.orderId);
    }
  }

  initForm(): void {
    this.orderForm = this.fb.group({
      customerId: [null, [Validators.required]],
      orderDate: [new Date(), [Validators.required]],
      expectedDeliveryDate: [null],
      items: this.fb.array([]),
      notes: ['']
    });
    if (!this.isEditMode) this.addItem();
  }

  loadData(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: (res) => { this.customers = res.data; }
    });
    this.productService.getProducts({ limit: 200 }).subscribe({
      next: (res) => { this.products = res.data; }
    });
  }

  loadOrder(id: string): void {
    this.loading = true;
    this.salesService.getSalesOrderById(id).subscribe({
      next: (res) => {
        const order = res.data;
        this.fromQuotation = order.quotationId || null;
        this.orderForm.patchValue({
          customerId: order.customerId,
          orderDate: new Date(order.orderDate),
          expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : null,
          notes: order.notes
        });
        this.items.clear();
        order.items.forEach(item => {
          this.items.push(this.fb.group({
            productId: [item.productId, [Validators.required]],
            quantity: [item.quantity, [Validators.required]],
            unitPrice: [item.unitPrice, [Validators.required]],
            discount: [item.discount || 0],
            deliveredQty: [item.deliveredQty || 0],
            taxRate: [item.taxRate || 18],
            total: [item.total]
          }));
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get items(): FormArray { return this.orderForm.get('items') as FormArray; }

  addItem(): void {
    this.items.push(this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0],
      deliveredQty: [0],
      taxRate: [18],
      total: [0]
    }));
  }

  removeItem(index: number): void { this.items.removeAt(index); }

  onProductChange(index: number): void {
    const productId = this.items.at(index).get('productId')?.value;
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.items.at(index).patchValue({ unitPrice: product.sellingPrice || product.unitPrice || 0 });
      this.calculateLineTotal(index);
    }
  }

  calculateLineTotal(index: number): void {
    const item = this.items.at(index);
    const qty = item.get('quantity')?.value || 0;
    const price = item.get('unitPrice')?.value || 0;
    const discount = item.get('discount')?.value || 0;
    const taxRate = item.get('taxRate')?.value || 18;
    const lineTotal = qty * price;
    const discountAmount = lineTotal * (discount / 100);
    const taxableAmount = lineTotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;
    item.patchValue({ total }, { emitEvent: false });
  }

  get subtotal(): number {
    return this.items.controls.reduce((sum, item) => sum + ((item.get('quantity')?.value || 0) * (item.get('unitPrice')?.value || 0)), 0);
  }

  get totalDiscount(): number {
    return this.items.controls.reduce((sum, item) => {
      const lineTotal = (item.get('quantity')?.value || 0) * (item.get('unitPrice')?.value || 0);
      return sum + (lineTotal * ((item.get('discount')?.value || 0) / 100));
    }, 0);
  }

  get taxAmount(): number { return (this.subtotal - this.totalDiscount) * 0.18; }
  get grandTotal(): number { return this.subtotal - this.totalDiscount + this.taxAmount; }

  onSubmit(): void {
    if (this.orderForm.valid) {
      this.saving = true;
      const formData = {
        ...this.orderForm.value,
        status: 'DRAFT',
        subtotal: this.subtotal,
        discount: this.totalDiscount,
        taxAmount: this.taxAmount,
        totalAmount: this.grandTotal
      };

      this.salesService.createSalesOrder(formData).subscribe({
        next: () => {
          this.message.success('Sales Order created');
          this.router.navigate(['/sales/orders']);
        },
        error: () => { this.saving = false; },
        complete: () => { this.saving = false; }
      });
    }
  }

  onCancel(): void { this.router.navigate(['/sales/orders']); }
}

