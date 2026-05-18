import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { PurchasesService } from '../services/purchases.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { GoodsReceivedNote } from '../models/purchases.model';

@Component({
  selector: 'app-grn-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NzCardModule, NzTableModule,
    NzButtonModule, NzIconModule, NzTagModule, NzInputModule, NzSpaceModule, NzModalModule,
    NzFormModule, NzSelectModule, NzInputNumberModule, NzMessageModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Goods Received Notes</h2>
          <p>Track goods received against purchase orders</p>
        </div>
        <button nz-button nzType="primary" (click)="openCreateModal()">
          <span nz-icon nzType="plus"></span> New GRN
        </button>
      </div>

      <nz-table #table [nzData]="grns" [nzLoading]="loading" [nzTotal]="total"
        [nzPageSize]="pageSize" [(nzPageIndex)]="page" (nzPageIndexChange)="loadData()"
        nzSize="middle" [nzFrontPagination]="false">
        <thead>
          <tr>
            <th>GRN Number</th>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>Warehouse</th>
            <th>Received Date</th>
            <th nzAlign="center">Items</th>
            <th nzAlign="center" nzWidth="80px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let grn of table.data">
            <td><strong>{{ grn.grnNumber }}</strong></td>
            <td>{{ grn.purchaseOrder?.poNumber || '-' }}</td>
            <td>{{ grn.purchaseOrder?.vendor?.name || '-' }}</td>
            <td>{{ grn.warehouse?.name || '-' }}</td>
            <td>{{ grn.receivedDate | date:'dd MMM yyyy' }}</td>
            <td nzAlign="center"><nz-tag>{{ grn.items?.length || 0 }} items</nz-tag></td>
            <td nzAlign="center">
              <button nz-button nzType="default" nzSize="small" (click)="viewGrn(grn)">
                <span nz-icon nzType="eye"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>

    <nz-modal [(nzVisible)]="modalVisible" nzTitle="New Goods Received Note"
      (nzOnCancel)="modalVisible=false" (nzOnOk)="submitGRN()" [nzOkLoading]="saving" nzWidth="700px">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="grnForm" nzLayout="vertical">
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Purchase Order</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="purchaseOrderId" nzShowSearch nzPlaceHolder="Select PO"
                    (ngModelChange)="onPoChange($event)">
                    <nz-option *ngFor="let po of purchaseOrders" [nzLabel]="po.poNumber" [nzValue]="po.id"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Warehouse</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="warehouseId" nzPlaceHolder="Select warehouse">
                    <nz-option *ngFor="let w of warehouses" [nzLabel]="w.name" [nzValue]="w.id"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <div formArrayName="items">
            <p><strong>Items to Receive:</strong></p>
            <div *ngFor="let item of grnItems.controls; let i=index" [formGroupName]="i">
              <div nz-row [nzGutter]="8" style="margin-bottom:8px;align-items:center">
                <div nz-col [nzSpan]="10">
                  <span>{{ getProductName(item.get('productId')?.value) }}</span>
                </div>
                <div nz-col [nzSpan]="6">
                  <nz-input-number formControlName="quantity" [nzMin]="1" style="width:100%" nzPlaceHolder="Qty"></nz-input-number>
                </div>
                <div nz-col [nzSpan]="8">
                  <input nz-input formControlName="batchNumber" placeholder="Batch # (optional)" />
                </div>
              </div>
            </div>
          </div>

          <nz-form-item>
            <nz-form-label>Notes</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="notes" [nzAutosize]="{minRows:2,maxRows:3}"></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
  `]
})
export class GrnListComponent implements OnInit {
  grns: any[] = [];
  loading = false;
  total = 0;
  page = 1;
  pageSize = 20;
  modalVisible = false;
  saving = false;
  purchaseOrders: any[] = [];
  warehouses: any[] = [];
  poProducts: any[] = [];
  grnForm!: FormGroup;

  constructor(
    private service: PurchasesService,
    private masterData: MasterDataService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.grnForm = this.fb.group({
      purchaseOrderId: [null, Validators.required],
      warehouseId: [null, Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
    this.loadData();
    this.loadDropdowns();
  }

  loadData() {
    this.loading = true;
    this.service.getGRNs({ page: this.page, limit: this.pageSize }).subscribe({
      next: (res: any) => {
        const data = res.data?.data ?? res.data ?? res;
        this.grns = Array.isArray(data) ? data : data.data ?? [];
        this.total = res.data?.meta?.total ?? res.meta?.total ?? this.grns.length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadDropdowns() {
    this.service.getPurchaseOrders({ limit: 100, status: 'CONFIRMED' }).subscribe((res: any) => {
      const data = res.data?.data ?? res.data ?? res;
      this.purchaseOrders = Array.isArray(data) ? data : data.data ?? [];
      const poId = this.route.snapshot.queryParamMap.get('poId');
      if (poId) {
        this.openCreateModal();
        this.grnForm.patchValue({ purchaseOrderId: poId });
        this.onPoChange(poId);
      }
    });
    this.masterData.getWarehouses().subscribe((res: any) => {
      const data = res.data?.data ?? res.data ?? res;
      this.warehouses = Array.isArray(data) ? data : [];
    });
  }

  get grnItems(): FormArray { return this.grnForm.get('items') as FormArray; }

  onPoChange(poId: string) {
    const po = this.purchaseOrders.find(p => p.id === poId);
    this.grnItems.clear();
    this.poProducts = [];
    if (po?.items) {
      this.poProducts = po.items;
      po.items.forEach((item: any) => {
        this.grnItems.push(this.fb.group({
          productId: [item.productId],
          quantity: [item.quantity - (item.receivedQty ?? 0), [Validators.required, Validators.min(1)]],
          batchNumber: ['']
        }));
      });
    }
  }

  getProductName(productId: string): string {
    const p = this.poProducts.find((i: any) => i.productId === productId);
    return p?.product?.name ?? productId;
  }

  openCreateModal() {
    this.grnForm.reset();
    this.grnItems.clear();
    this.modalVisible = true;
  }

  viewGrn(grn: any) {
    this.message.info(`GRN ${grn.grnNumber} - ${grn.items?.length ?? 0} items received`);
  }

  submitGRN() {
    if (this.grnForm.invalid) return;
    this.saving = true;
    this.service.createGRN(this.grnForm.value).subscribe({
      next: () => { this.message.success('GRN created and stock updated'); this.modalVisible = false; this.loadData(); this.saving = false; },
      error: (e) => { this.message.error(e.error?.message ?? 'Failed'); this.saving = false; }
    });
  }
}
