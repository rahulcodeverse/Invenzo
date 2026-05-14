import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PurchasesService } from '../services/purchases.service';
import { PurchaseOrder } from '../models/purchases.model';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzIconModule, NzTagModule, NzInputModule, NzSelectModule, NzSpaceModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Purchase Orders</h2>
          <p>Manage and track purchase orders</p>
        </div>
        <div class="header-right">
          <a nz-button nzType="primary" routerLink="/purchases/orders/new">
            <span nz-icon nzType="plus"></span> New PO
          </a>
        </div>
      </div>

      <div class="filters">
        <nz-input-group [nzPrefix]="searchIcon" style="width:280px">
          <input nz-input placeholder="Search PO number..." [(ngModel)]="searchTerm" (ngModelChange)="onSearch($event)" />
        </nz-input-group>
        <nz-select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" nzPlaceHolder="Filter by status" style="width:160px" nzAllowClear>
          <nz-option nzValue="DRAFT" nzLabel="Draft"></nz-option>
          <nz-option nzValue="SENT" nzLabel="Sent"></nz-option>
          <nz-option nzValue="APPROVED" nzLabel="Approved"></nz-option>
          <nz-option nzValue="RECEIVED" nzLabel="Received"></nz-option>
          <nz-option nzValue="CLOSED" nzLabel="Closed"></nz-option>
          <nz-option nzValue="CANCELLED" nzLabel="Cancelled"></nz-option>
        </nz-select>
        <ng-template #searchIcon><span nz-icon nzType="search"></span></ng-template>
      </div>

      <nz-table #table [nzData]="orders" [nzLoading]="loading" [nzTotal]="total"
        [nzPageSize]="pageSize" [(nzPageIndex)]="page" (nzPageIndexChange)="loadData()"
        nzSize="middle" [nzFrontPagination]="false">
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>Order Date</th>
            <th>Expected Date</th>
            <th nzAlign="right">Total</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="140px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let po of table.data">
            <td><strong>{{ po.poNumber }}</strong></td>
            <td>{{ po.vendor?.name || '-' }}</td>
            <td>{{ po.orderDate | date:'dd MMM yyyy' }}</td>
            <td>{{ po.expectedDeliveryDate ? (po.expectedDeliveryDate | date:'dd MMM yyyy') : '-' }}</td>
            <td nzAlign="right">{{ po.totalAmount | number:'1.2-2' }}</td>
            <td nzAlign="center">
              <nz-tag [nzColor]="getStatusColor(po.status)">{{ po.status }}</nz-tag>
            </td>
            <td nzAlign="center">
              <nz-space>
                <a *nzSpaceItem nz-button nzType="default" nzSize="small" [routerLink]="['/purchases/orders', po.id]">
                  <span nz-icon nzType="eye"></span>
                </a>
                <ng-container *ngIf="po.status === 'DRAFT'">
                  <button *nzSpaceItem nz-button nzType="default" nzSize="small" (click)="approve(po)">
                    <span nz-icon nzType="check"></span>
                  </button>
                </ng-container>
                <ng-container *ngIf="po.status !== 'CANCELLED' && po.status !== 'CLOSED'">
                  <button *nzSpaceItem nz-button nzDanger nzSize="small" (click)="cancel(po)">
                    <span nz-icon nzType="stop"></span>
                  </button>
                </ng-container>
              </nz-space>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .filters { display:flex; gap:12px; margin-bottom:16px; }
  `]
})
export class PoListComponent implements OnInit {
  orders: PurchaseOrder[] = [];
  loading = false;
  total = 0;
  page = 1;
  pageSize = 20;
  searchTerm = '';
  statusFilter = '';
  private search$ = new Subject<string>();

  constructor(private service: PurchasesService, private message: NzMessageService, private modal: NzModalService) {}

  ngOnInit() {
    this.search$.pipe(debounceTime(300)).subscribe(() => { this.page = 1; this.loadData(); });
    this.loadData();
  }

  onSearch(v: string) { this.search$.next(v); }

  loadData() {
    this.loading = true;
    this.service.getPurchaseOrders({ page: this.page, limit: this.pageSize, search: this.searchTerm, status: this.statusFilter }).subscribe({
      next: (res: any) => {
        const data = res.data?.data ?? res.data ?? res;
        this.orders = Array.isArray(data) ? data : data.data ?? [];
        this.total = res.data?.meta?.total ?? res.meta?.total ?? this.orders.length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getStatusColor(s: string) {
    return { DRAFT:'default', SENT:'blue', APPROVED:'cyan', RECEIVED:'orange', CLOSED:'green', CANCELLED:'red' }[s] ?? 'default';
  }

  approve(po: PurchaseOrder) {
    this.modal.confirm({
      nzTitle: 'Approve Purchase Order',
      nzContent: `Approve ${po.poNumber}?`,
      nzOkText: 'Approve',
      nzOnOk: () => this.service.approvePurchaseOrder(po.id).subscribe({
        next: () => { this.message.success('Approved'); this.loadData(); },
        error: (e) => this.message.error(e.error?.message ?? 'Failed')
      })
    });
  }

  cancel(po: PurchaseOrder) {
    this.modal.confirm({
      nzTitle: 'Cancel Purchase Order',
      nzContent: `Cancel ${po.poNumber}?`,
      nzOkDanger: true,
      nzOkText: 'Cancel PO',
      nzOnOk: () => this.service.cancelPurchaseOrder(po.id).subscribe({
        next: () => { this.message.success('Cancelled'); this.loadData(); },
        error: (e) => this.message.error(e.error?.message ?? 'Failed')
      })
    });
  }
}
