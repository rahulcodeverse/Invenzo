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
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { ProductApiService, Product } from '../../../products/services/product-api.service';
import { Customer } from '../../../../core/models/master-data.model';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule,
    NzSelectModule, NzButtonModule, NzInputNumberModule, NzDatePickerModule,
    NzGridModule, NzIconModule, NzDividerModule, NzTableModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <h2>{{ isEditMode ? 'Edit' : 'New' }} Quotation</h2>
      </div>

      <form nz-form [formGroup]="quotationForm" (ngSubmit)="onSubmit()" nzLayout="vertical">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Customer</nz-form-label>
              <nz-form-control nzErrorTip="Please select customer">
                <nz-select formControlName="customerId" nzShowSearch nzPlaceHolder="Select customer">
                  <nz-option *ngFor="let c of customers" [nzLabel]="c.name" [nzValue]="c.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Quotation Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="quotationDate" style="width: 100%;"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Valid Until</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="validUntil" style="width: 100%;"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-divider nzText="Line Items"></nz-divider>

        <nz-table [nzData]="items.controls" [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th nzWidth="40%">Product</th>
              <th nzWidth="15%">Qty</th>
              <th nzWidth="15%">Price</th>
              <th nzWidth="10%">Discount %</th>
              <th nzWidth="15%">Total</th>
              <th nzWidth="5%"></th>
            </tr>
          </thead>
          <tbody formArrayName="items">
            <tr *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
              <td>
                <nz-select formControlName="productId" nzShowSearch nzPlaceHolder="Select product"
                           (ngModelChange)="onProductChange(i)" style="width: 100%;">
                  <nz-option *ngFor="let p of products" [nzLabel]="p.name + ' (' + p.sku + ')'" [nzValue]="p.id"></nz-option>
                </nz-select>
              </td>
              <td>
                <nz-input-number formControlName="quantity" [nzMin]="1" (ngModelChange)="calculateLineTotal(i)" style="width: 100%;"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="unitPrice" [nzMin]="0" [nzStep]="0.01" (ngModelChange)="calculateLineTotal(i)" style="width: 100%;"></nz-input-number>
              </td>
              <td>
                <nz-input-number formControlName="discount" [nzMin]="0" [nzMax]="100" (ngModelChange)="calculateLineTotal(i)" style="width: 100%;"></nz-input-number>
              </td>
              <td><strong>₹{{ item.get('total')?.value?.toLocaleString() || 0 }}</strong></td>
              <td>
                <button nz-button nzSize="small" nzDanger (click)="removeItem(i)" type="button">
                  <span nz-icon nzType="delete"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <button nz-button nzType="dashed" (click)="addItem()" type="button" style="margin-top: 8px; width: 100%;">
          <span nz-icon nzType="plus"></span> Add Line Item
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
            <textarea nz-input formControlName="notes" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
          </nz-form-control>
        </nz-form-item>

        <div class="form-actions">
          <button nz-button nzType="default" (click)="onCancel()" [disabled]="saving">Cancel</button>
          <button nz-button nzType="primary" type="submit" [nzLoading]="saving" [disabled]="!quotationForm.valid">
            {{ isEditMode ? 'Update' : 'Create' }} Quotation
          </button>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .totals-section { max-width: 400px; margin-left: auto; margin-top: 16px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.grand { border-top: 2px solid #d9d9d9; margin-top: 8px; padding-top: 12px; font-size: 18px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; }
  `]
})
export class QuotationFormComponent implements OnInit {
  quotationForm!: FormGroup;
  customers: Customer[] = [];
  products: Product[] = [];
  isEditMode = false;
  quotationId: string | null = null;
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
    this.quotationId = this.route.snapshot.paramMap.get('id');
    if (this.quotationId) {
      this.isEditMode = true;
      this.loadQuotation(this.quotationId);
    }
  }

  initForm(): void {
    this.quotationForm = this.fb.group({
      customerId: [null, [Validators.required]],
      quotationDate: [new Date(), [Validators.required]],
      validUntil: [new Date(Date.now() + 30*24*60*60*1000), [Validators.required]],
      items: this.fb.array([]),
      notes: ['']
    });
    this.addItem(); // Start with one item
  }

  loadData(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: (res) => { this.customers = res.data; }
    });
    this.productService.getProducts({ limit: 200 }).subscribe({
      next: (res) => { this.products = res.data; }
    });
  }

  loadQuotation(id: string): void {
    this.loading = true;
    this.salesService.getQuotationById(id).subscribe({
      next: (res) => {
        const quote = res.data;
        this.quotationForm.patchValue({
          customerId: quote.customerId,
          quotationDate: new Date(quote.quotationDate),
          validUntil: new Date(quote.validUntil),
          notes: quote.notes
        });
        this.items.clear();
        quote.items.forEach(item => {
          this.items.push(this.fb.group({
            productId: [item.productId, [Validators.required]],
            quantity: [item.quantity, [Validators.required, Validators.min(1)]],
            unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
            discount: [item.discount || 0, [Validators.min(0)]],
            taxRate: [item.taxRate || 18],
            total: [item.total]
          }));
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get items(): FormArray { return this.quotationForm.get('items') as FormArray; }

  addItem(): void {
    this.items.push(this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      taxRate: [18],
      total: [0]
    }));
  }

  removeItem(index: number): void { this.items.removeAt(index); this.calculateTotals(); }

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
    this.calculateTotals();
  }

  get subtotal(): number {
    return this.items.controls.reduce((sum, item) => {
      const qty = item.get('quantity')?.value || 0;
      const price = item.get('unitPrice')?.value || 0;
      return sum + (qty * price);
    }, 0);
  }

  get totalDiscount(): number {
    return this.items.controls.reduce((sum, item) => {
      const qty = item.get('quantity')?.value || 0;
      const price = item.get('unitPrice')?.value || 0;
      const discount = item.get('discount')?.value || 0;
      return sum + ((qty * price) * (discount / 100));
    }, 0);
  }

  get taxAmount(): number {
    const taxableAmount = this.subtotal - this.totalDiscount;
    return taxableAmount * 0.18;
  }

  get grandTotal(): number { return this.subtotal - this.totalDiscount + this.taxAmount; }

  calculateTotals(): void { /* Trigger change detection */ }

  onSubmit(): void {
    if (this.quotationForm.valid) {
      this.saving = true;
      const formData = {
        ...this.quotationForm.value,
        status: 'DRAFT',
        subtotal: this.subtotal,
        discount: this.totalDiscount,
        taxAmount: this.taxAmount,
        totalAmount: this.grandTotal
      };

      const request = this.isEditMode
        ? this.salesService.updateQuotation(this.quotationId!, formData)
        : this.salesService.createQuotation(formData);

      request.subscribe({
        next: () => {
          this.message.success(this.isEditMode ? 'Updated' : 'Created');
          this.router.navigate(['/sales/quotations']);
        },
        error: () => { this.saving = false; },
        complete: () => { this.saving = false; }
      });
    }
  }

  onCancel(): void { this.router.navigate(['/sales/quotations']); }
}

