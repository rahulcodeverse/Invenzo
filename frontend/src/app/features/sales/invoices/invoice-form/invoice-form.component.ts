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
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { ProductApiService, Product } from '../../../products/services/product-api.service';
import { Customer } from '../../../../core/models/master-data.model';
import { SalesOrder } from '../../models/sales.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule,
    NzSelectModule, NzButtonModule, NzInputNumberModule, NzDatePickerModule,
    NzGridModule, NzIconModule, NzDividerModule, NzTableModule, NzDescriptionsModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <h2>{{ isViewMode ? 'View Invoice' : 'New Invoice' }}</h2>
      </div>

      <form nz-form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()" nzLayout="vertical">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Customer</nz-form-label>
              <nz-form-control nzErrorTip="Please select customer">
                <nz-select formControlName="customerId" nzShowSearch nzPlaceHolder="Select customer"
                          (ngModelChange)="onCustomerChange()" [nzDisabled]="isViewMode || fromSalesOrder">
                  <nz-option *ngFor="let c of customers" [nzLabel]="c.name" [nzValue]="c.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Invoice Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="invoiceDate" style="width: 100%;" [nzDisabled]="isViewMode"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Due Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="dueDate" style="width: 100%;" [nzDisabled]="isViewMode"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-form-item *ngIf="!fromSalesOrder">
          <nz-form-label>Sales Order</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="salesOrderId" nzShowSearch nzAllowClear nzPlaceHolder="Optional: Link to Sales Order"
                      (ngModelChange)="onSalesOrderChange()" [nzDisabled]="isViewMode">
              <nz-option *ngFor="let so of salesOrders" [nzLabel]="so.orderNumber + ' - ' + so.customer?.name"
                        [nzValue]="so.id"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-divider nzText="Invoice Items"></nz-divider>

        <nz-table [nzData]="items.controls" [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th nzWidth="35%">Product</th>
              <th nzWidth="12%">Qty</th>
              <th nzWidth="12%">Price</th>
              <th nzWidth="10%">Discount %</th>
              <th nzWidth="10%">Tax %</th>
              <th nzWidth="15%">Total</th>
              <th nzWidth="5%" *ngIf="!isViewMode"></th>
            </tr>
          </thead>
          <tbody formArrayName="items">
            <tr *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
              <td>
                <nz-select formControlName="productId" nzShowSearch nzPlaceHolder="Select product"
                          (ngModelChange)="onProductChange(i)" style="width: 100%;" [nzDisabled]="isViewMode">
                  <nz-option *ngFor="let p of products" [nzLabel]="p.name + ' (' + p.sku + ')'" [nzValue]="p.id"></nz-option>
                </nz-select>
              </td>
              <td>
                <nz-input-number formControlName="quantity" [nzMin]="1" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isViewMode"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="unitPrice" [nzMin]="0" [nzStep]="0.01" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isViewMode"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="discount" [nzMin]="0" [nzMax]="100" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isViewMode"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="taxRate" [nzMin]="0" [nzMax]="100" (ngModelChange)="calculateLineTotal(i)"
                                style="width: 100%;" [nzDisabled]="isViewMode"></nz-input-number>
              </td>
              <td><strong>₹{{ item.get('total')?.value?.toLocaleString() || 0 }}</strong></td>
              <td *ngIf="!isViewMode">
                <button nz-button nzSize="small" nzDanger (click)="removeItem(i)" type="button">
                  <span nz-icon nzType="delete"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <button *ngIf="!isViewMode" nz-button nzType="dashed" (click)="addItem()" type="button"
                style="margin-top: 8px; width: 100%;">
          <span nz-icon nzType="plus"></span> Add Item
        </button>

        <nz-divider></nz-divider>

        <div class="gst-breakdown">
          <nz-descriptions nzTitle="GST Breakdown" nzBordered [nzColumn]="2" nzSize="small">
            <nz-descriptions-item nzTitle="Subtotal">₹{{ subtotal.toLocaleString() }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Discount">₹{{ totalDiscount.toLocaleString() }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Taxable Amount">₹{{ taxableAmount.toLocaleString() }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="GST Amount">₹{{ gstAmount.toLocaleString() }}</nz-descriptions-item>
            <nz-descriptions-item nzTitle="Grand Total" [nzSpan]="2">
              <strong style="font-size: 18px;">₹{{ grandTotal.toLocaleString() }}</strong>
            </nz-descriptions-item>
          </nz-descriptions>
        </div>

        <nz-form-item style="margin-top: 16px;">
          <nz-form-label>Notes</nz-form-label>
          <nz-form-control>
            <textarea nz-input formControlName="notes" [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                      [disabled]="isViewMode"></textarea>
          </nz-form-control>
        </nz-form-item>

        <div class="form-actions">
          <button nz-button nzType="default" (click)="onCancel()">Back</button>
          <button *ngIf="!isViewMode" nz-button nzType="primary" type="submit" [nzLoading]="saving"
                  [disabled]="!invoiceForm.valid">
            Generate Invoice
          </button>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .gst-breakdown { margin-top: 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; }
  `]
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm!: FormGroup;
  customers: Customer[] = [];
  products: Product[] = [];
  salesOrders: SalesOrder[] = [];
  isViewMode = false;
  fromSalesOrder = false;
  invoiceId: string | null = null;
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
    this.invoiceId = this.route.snapshot.paramMap.get('id');
    if (this.invoiceId) {
      this.isViewMode = true;
      this.loadInvoice(this.invoiceId);
    }
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      customerId: [null, [Validators.required]],
      salesOrderId: [null],
      invoiceDate: [new Date(), [Validators.required]],
      dueDate: [new Date(Date.now() + 30*24*60*60*1000), [Validators.required]],
      items: this.fb.array([]),
      notes: ['']
    });
    if (!this.isViewMode) this.addItem();
  }

  loadData(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: (res) => { this.customers = res.data; }
    });
    this.productService.getProducts({ limit: 200 }).subscribe({
      next: (res) => { this.products = res.data; }
    });
    this.salesService.getSalesOrders({ limit: 200, status: 'CONFIRMED' }).subscribe({
      next: (res) => { this.salesOrders = res.data; }
    });
  }

  loadInvoice(id: string): void {
    this.loading = true;
    this.salesService.getSalesInvoiceById(id).subscribe({
      next: (res) => {
        const invoice = res.data;
        this.invoiceForm.patchValue({
          customerId: invoice.customerId,
          salesOrderId: invoice.salesOrderId,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: new Date(invoice.dueDate),
          notes: invoice.notes
        });
        this.items.clear();
        invoice.items.forEach(item => {
          this.items.push(this.fb.group({
            productId: [item.productId, [Validators.required]],
            quantity: [item.quantity, [Validators.required]],
            unitPrice: [item.unitPrice, [Validators.required]],
            discount: [item.discount || 0],
            taxRate: [item.taxRate || 18],
            total: [item.total]
          }));
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get items(): FormArray { return this.invoiceForm.get('items') as FormArray; }

  addItem(): void {
    this.items.push(this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0],
      taxRate: [18],
      total: [0]
    }));
  }

  removeItem(index: number): void { this.items.removeAt(index); }

  onCustomerChange(): void { /* Load customer-specific data if needed */ }

  onSalesOrderChange(): void {
    const soId = this.invoiceForm.get('salesOrderId')?.value;
    if (soId) {
      this.salesService.getSalesOrderById(soId).subscribe({
        next: (res) => {
          const so = res.data;
          this.invoiceForm.patchValue({ customerId: so.customerId });
          this.items.clear();
          so.items.forEach(item => {
            this.items.push(this.fb.group({
              productId: [item.productId, [Validators.required]],
              quantity: [item.quantity, [Validators.required]],
              unitPrice: [item.unitPrice, [Validators.required]],
              discount: [item.discount || 0],
              taxRate: [item.taxRate || 18],
              total: [0]
            }));
            this.calculateLineTotal(this.items.length - 1);
          });
        }
      });
    }
  }

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

  get taxableAmount(): number { return this.subtotal - this.totalDiscount; }

  get gstAmount(): number {
    return this.items.controls.reduce((sum, item) => {
      const qty = item.get('quantity')?.value || 0;
      const price = item.get('unitPrice')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      const taxRate = item.get('taxRate')?.value || 18;
      const lineTotal = qty * price;
      const discountAmount = lineTotal * (discount / 100);
      const taxableAmount = lineTotal - discountAmount;
      return sum + (taxableAmount * (taxRate / 100));
    }, 0);
  }

  get grandTotal(): number { return this.taxableAmount + this.gstAmount; }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      this.saving = true;
      const formData = {
        ...this.invoiceForm.value,
        status: 'PENDING',
        subtotal: this.subtotal,
        discount: this.totalDiscount,
        taxAmount: this.gstAmount,
        totalAmount: this.grandTotal,
        paidAmount: 0,
        balanceAmount: this.grandTotal
      };

      this.salesService.createSalesInvoice(formData).subscribe({
        next: () => {
          this.message.success('Invoice generated successfully');
          this.router.navigate(['/sales/invoices']);
        },
        error: () => { this.saving = false; },
        complete: () => { this.saving = false; }
      });
    }
  }

  onCancel(): void { this.router.navigate(['/sales/invoices']); }
}

