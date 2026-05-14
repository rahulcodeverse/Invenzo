import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PurchasesService } from '../services/purchases.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { ProductApiService } from '../../products/services/product-api.service';
import { Vendor } from '../../../core/models/master-data.model';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, NzCardModule, NzFormModule, NzInputModule,
    NzSelectModule, NzButtonModule, NzInputNumberModule, NzDatePickerModule,
    NzGridModule, NzIconModule, NzDividerModule, NzTagModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <h2>{{ isViewMode ? 'Purchase Order' : (isEditMode ? 'Edit PO' : 'New Purchase Order') }}</h2>
        <div>
          <button nz-button routerLink="/purchases/orders" style="margin-right:8px">
            <span nz-icon nzType="arrow-left"></span> Back
          </button>
          <button *ngIf="!isViewMode" nz-button nzType="primary" (click)="onSubmit()" [nzLoading]="saving">
            Save
          </button>
        </div>
      </div>

      <form nz-form [formGroup]="form" nzLayout="vertical">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>Vendor</nz-form-label>
              <nz-form-control nzErrorTip="Required">
                <nz-select formControlName="vendorId" nzShowSearch nzPlaceHolder="Select vendor" [nzDisabled]="isViewMode">
                  <nz-option *ngFor="let v of vendors" [nzLabel]="v.name" [nzValue]="v.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label nzRequired>Order Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="orderDate" style="width:100%" [nzDisabled]="isViewMode"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="8">
            <nz-form-item>
              <nz-form-label>Expected Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="expectedDate" style="width:100%" [nzDisabled]="isViewMode"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-divider nzText="Items"></nz-divider>

        <div formArrayName="items">
          <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="item-row">
            <div nz-row [nzGutter]="8" style="align-items:flex-end">
              <div nz-col [nzSpan]="6">
                <nz-form-item>
                  <nz-form-label *ngIf="i===0">Product</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="productId" nzShowSearch nzPlaceHolder="Select product"
                      [nzDisabled]="isViewMode" (ngModelChange)="onProductChange(i, $event)">
                      <nz-option *ngFor="let p of products" [nzLabel]="p.name + ' (' + p.sku + ')'" [nzValue]="p.id"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="3">
                <nz-form-item>
                  <nz-form-label *ngIf="i===0">Qty</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="quantity" [nzMin]="1" style="width:100%" [nzDisabled]="isViewMode" (ngModelChange)="calcItem(i)"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="4">
                <nz-form-item>
                  <nz-form-label *ngIf="i===0">Unit Price</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="unitPrice" [nzMin]="0" [nzStep]="0.01" style="width:100%" [nzDisabled]="isViewMode" (ngModelChange)="calcItem(i)"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="3">
                <nz-form-item>
                  <nz-form-label *ngIf="i===0">Tax %</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="taxRate" [nzMin]="0" [nzMax]="100" style="width:100%" [nzDisabled]="isViewMode" (ngModelChange)="calcItem(i)"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="4">
                <nz-form-item>
                  <nz-form-label *ngIf="i===0">Total</nz-form-label>
                  <nz-form-control>
                    <nz-input-number formControlName="total" style="width:100%" [nzDisabled]="true"></nz-input-number>
                  </nz-form-control>
                </nz-form-item>
              </div>
              <div nz-col [nzSpan]="2" *ngIf="!isViewMode">
                <nz-form-item>
                  <nz-form-label *ngIf="i===0" style="visibility:hidden">X</nz-form-label>
                  <nz-form-control>
                    <button nz-button nzDanger nzType="text" (click)="removeItem(i)" [disabled]="items.length === 1">
                      <span nz-icon nzType="delete"></span>
                    </button>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>
          </div>
        </div>

        <button *ngIf="!isViewMode" nz-button nzType="dashed" style="width:100%;margin-bottom:16px" (click)="addItem()">
          <span nz-icon nzType="plus"></span> Add Item
        </button>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>Notes</nz-form-label>
              <nz-form-control>
                <textarea nz-input formControlName="notes" [nzAutosize]="{minRows:2,maxRows:4}" [disabled]="isViewMode"></textarea>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <div class="totals-box">
              <div class="total-row"><span>Subtotal:</span><strong>{{ subtotal | number:'1.2-2' }}</strong></div>
              <div class="total-row"><span>Tax:</span><strong>{{ taxAmount | number:'1.2-2' }}</strong></div>
              <div class="total-row grand"><span>Total:</span><strong>{{ total | number:'1.2-2' }}</strong></div>
            </div>
          </div>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:600; }
    .item-row { background:#fafafa; padding:8px; border-radius:4px; margin-bottom:8px; }
    .totals-box { background:#f5f5f5; padding:16px; border-radius:8px; }
    .total-row { display:flex; justify-content:space-between; margin-bottom:8px; }
    .total-row.grand { font-size:16px; border-top:1px solid #ddd; padding-top:8px; margin-top:8px; }
  `]
})
export class PoFormComponent implements OnInit {
  form!: FormGroup;
  vendors: Vendor[] = [];
  products: any[] = [];
  saving = false;
  isEditMode = false;
  isViewMode = false;
  subtotal = 0;
  taxAmount = 0;
  total = 0;

  constructor(
    private fb: FormBuilder,
    private service: PurchasesService,
    private masterData: MasterDataService,
    private productApi: ProductApiService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isViewMode = !!id;
    this.isEditMode = false;

    this.form = this.fb.group({
      vendorId: [null, Validators.required],
      orderDate: [new Date(), Validators.required],
      expectedDate: [null],
      notes: [''],
      items: this.fb.array([this.createItem()])
    });

    this.masterData.getVendors().subscribe((res: any) => {
      const data = res.data?.data ?? res.data ?? res;
      this.vendors = Array.isArray(data) ? data : [];
    });

    this.productApi.getProducts({ limit: 200 }).subscribe((res: any) => {
      const data = res.data?.data ?? res.data ?? res;
      this.products = Array.isArray(data) ? data : [];
    });

    if (id) {
      this.service.getPurchaseOrderById(id).subscribe({
        next: (res: any) => {
          const po = res.data ?? res;
          this.form.patchValue({ vendorId: po.vendorId, orderDate: new Date(po.orderDate), expectedDate: po.expectedDate ? new Date(po.expectedDate) : null, notes: po.notes });
          this.items.clear();
          (po.items ?? []).forEach((item: any) => {
            this.items.push(this.fb.group({
              productId: [item.productId],
              quantity: [item.quantity],
              unitPrice: [Number(item.unitPrice)],
              taxRate: [Number(item.taxRate)],
              taxAmount: [Number(item.taxAmount)],
              total: [Number(item.total)]
            }));
          });
          this.recalcTotals();
        }
      });
    }
  }

  get items(): FormArray { return this.form.get('items') as FormArray; }

  createItem() {
    return this.fb.group({ productId: [null, Validators.required], quantity: [1, [Validators.required, Validators.min(1)]], unitPrice: [0], taxRate: [0], taxAmount: [0], total: [0] });
  }

  addItem() { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); this.recalcTotals(); }

  onProductChange(i: number, productId: string) {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.items.at(i).patchValue({ unitPrice: Number(product.costPrice ?? 0), taxRate: Number(product.taxRate ?? 0) });
      this.calcItem(i);
    }
  }

  calcItem(i: number) {
    const ctrl = this.items.at(i);
    const qty = ctrl.get('quantity')?.value ?? 0;
    const price = ctrl.get('unitPrice')?.value ?? 0;
    const taxRate = ctrl.get('taxRate')?.value ?? 0;
    const sub = qty * price;
    const tax = (sub * taxRate) / 100;
    ctrl.patchValue({ taxAmount: tax, total: sub + tax }, { emitEvent: false });
    this.recalcTotals();
  }

  recalcTotals() {
    this.subtotal = this.items.controls.reduce((s, c) => s + (c.get('quantity')?.value ?? 0) * (c.get('unitPrice')?.value ?? 0), 0);
    this.taxAmount = this.items.controls.reduce((s, c) => s + (c.get('taxAmount')?.value ?? 0), 0);
    this.total = this.subtotal + this.taxAmount;
  }

  onSubmit() {
    if (this.form.invalid) { Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity({ onlySelf: true }); }); return; }
    this.saving = true;
    const val = this.form.value;
    const payload = { ...val, subtotal: this.subtotal, taxAmount: this.taxAmount, total: this.total };
    this.service.createPurchaseOrder(payload).subscribe({
      next: () => { this.message.success('Purchase Order created'); this.router.navigate(['/purchases/orders']); },
      error: (e) => { this.message.error(e.error?.message ?? 'Failed'); this.saving = false; }
    });
  }
}
