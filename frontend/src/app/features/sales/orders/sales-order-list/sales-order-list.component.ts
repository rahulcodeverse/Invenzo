import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { SalesOrder, SalesOrderStatus } from '../../models/sales.model';
import { Customer } from '../../../../core/models/master-data.model';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzInputModule,
    NzSelectModule, NzTagModule, NzModalModule, NzIconModule, NzSpaceModule,
    NzCardModule, NzProgressModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Sales Orders</h2>
          <p>Manage customer orders</p>
        </div>
        <div class="header-right">
          <button nz-button nzType="primary" (click)="navigateToNew()">
            <span nz-icon nzType="plus"></span>
            New Sales Order
          </button>
        </div>
      </div>

      <div class="filters-section">
        <nz-space [nzSize]="'middle'">
          <nz-input-group *nzSpaceItem nzSearch [nzAddOnAfter]="suffixIconButton" style="width: 300px;">
            <input type="text" nz-input placeholder="Search..." [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" />
          </nz-input-group>
          <ng-template #suffixIconButton>
            <button nz-button nzType="primary" nzSearch><span nz-icon nzType="search"></span></button>
          </ng-template>

          <nz-select *nzSpaceItem nzAllowClear nzPlaceHolder="Status" [(ngModel)]="selectedStatus"
                     (ngModelChange)="onFilterChange()" style="width: 150px;">
            <nz-option nzLabel="Draft" nzValue="DRAFT"></nz-option>
            <nz-option nzLabel="Confirmed" nzValue="CONFIRMED"></nz-option>
            <nz-option nzLabel="Processing" nzValue="PROCESSING"></nz-option>
            <nz-option nzLabel="Completed" nzValue="COMPLETED"></nz-option>
            <nz-option nzLabel="Cancelled" nzValue="CANCELLED"></nz-option>
          </nz-select>

          <nz-select *nzSpaceItem nzShowSearch nzAllowClear nzPlaceHolder="Customer"
                     [(ngModel)]="selectedCustomer" (ngModelChange)="onFilterChange()" style="width: 200px;">
            <nz-option *ngFor="let customer of customers" [nzLabel]="customer.name" [nzValue]="customer.id"></nz-option>
          </nz-select>

          <button *nzSpaceItem nz-button (click)="resetFilters()">
            <span nz-icon nzType="redo"></span> Reset
          </button>
        </nz-space>
      </div>

      <nz-table #table [nzData]="orders" [nzLoading]="loading" [nzTotal]="total"
                [nzPageSize]="pageSize" [nzPageIndex]="pageIndex" [nzFrontPagination]="false"
                (nzPageIndexChange)="onPageChange($event)" (nzPageSizeChange)="onPageSizeChange($event)"
                [nzShowSizeChanger]="true" [nzPageSizeOptions]="[10, 20, 50]">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Date</th>
            <th nzAlign="right">Amount</th>
            <th nzAlign="center">Delivery Progress</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="200px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of table.data">
            <td><nz-tag nzColor="purple">{{ order.orderNumber }}</nz-tag></td>
            <td><strong>{{ order.customer?.name || '-' }}</strong></td>
            <td>{{ order.orderDate | date:'dd/MM/yyyy' }}</td>
            <td nzAlign="right"><strong>₹{{ order.totalAmount.toLocaleString() }}</strong></td>
            <td nzAlign="center">
              <div style="width: 120px; margin: 0 auto;">
                <nz-progress [nzPercent]="getDeliveryProgress(order)" nzSize="small"
                            [nzStatus]="order.status === 'COMPLETED' ? 'success' : 'active'"></nz-progress>
              </div>
            </td>
            <td nzAlign="center">
              <nz-tag [nzColor]="getStatusColor(order.status)">{{ order.status }}</nz-tag>
            </td>
            <td nzAlign="center">
              <nz-space>
                <button *nzSpaceItem nz-button nzSize="small" (click)="viewOrder(order)">
                  <span nz-icon nzType="eye"></span>
                </button>
                <ng-container *ngIf="order.status === 'DRAFT'">
                  <button *nzSpaceItem nz-button nzSize="small" nzType="primary" (click)="confirmOrder(order)">
                    <span nz-icon nzType="check"></span> Confirm
                  </button>
                </ng-container>
                <ng-container *ngIf="order.status === 'CONFIRMED' || order.status === 'PROCESSING'">
                  <button *nzSpaceItem nz-button nzSize="small" (click)="createDelivery(order)">
                    <span nz-icon nzType="car"></span> Deliver
                  </button>
                </ng-container>
                <ng-container *ngIf="order.status === 'DRAFT' || order.status === 'CONFIRMED'">
                  <button *nzSpaceItem nz-button nzSize="small" nzDanger (click)="cancelOrder(order)">
                    <span nz-icon nzType="close"></span>
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .header-left p { margin: 4px 0 0; color: rgba(0, 0, 0, 0.45); }
    .filters-section { margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 4px; }
  `]
})
export class SalesOrderListComponent implements OnInit {
  orders: SalesOrder[] = [];
  customers: Customer[] = [];
  loading = false;
  total = 0;
  pageSize = 20;
  pageIndex = 1;
  searchText = '';
  selectedStatus: string | null = null;
  selectedCustomer: string | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private salesService: SalesService,
    private masterDataService: MasterDataService,
    private router: Router,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => this.loadOrders());
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();
  }

  loadOrders(): void {
    this.loading = true;
    this.salesService.getSalesOrders({
      page: this.pageIndex,
      limit: this.pageSize,
      search: this.searchText || undefined,
      status: this.selectedStatus || undefined,
      customerId: this.selectedCustomer || undefined
    }).subscribe({
      next: (res) => { this.orders = res.data; this.total = res.meta.total; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadCustomers(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: (res) => { this.customers = res.data; }
    });
  }

  onSearch(value: string): void { this.searchSubject.next(value); }
  onPageChange(page: number): void { this.pageIndex = page; this.loadOrders(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.pageIndex = 1; this.loadOrders(); }
  onFilterChange(): void { this.pageIndex = 1; this.loadOrders(); }
  resetFilters(): void { this.searchText = ''; this.selectedStatus = null; this.selectedCustomer = null; this.loadOrders(); }
  navigateToNew(): void { this.router.navigate(['/sales/orders/new']); }
  viewOrder(order: SalesOrder): void { this.router.navigate(['/sales/orders', order.id]); }

  getStatusColor(status: string): string {
    const colors: any = {
      DRAFT: 'default',
      CONFIRMED: 'blue',
      PROCESSING: 'orange',
      COMPLETED: 'green',
      CANCELLED: 'red'
    };
    return colors[status] || 'default';
  }

  getDeliveryProgress(order: SalesOrder): number {
    if (order.status === 'COMPLETED') return 100;
    if (order.status === 'DRAFT') return 0;
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const deliveredQty = order.items.reduce((sum, item) => sum + (item.deliveredQty || 0), 0);
    return totalQty > 0 ? Math.round((deliveredQty / totalQty) * 100) : 0;
  }

  confirmOrder(order: SalesOrder): void {
    this.modal.confirm({
      nzTitle: 'Confirm Sales Order',
      nzContent: `Confirm order ${order.orderNumber}? This will reserve stock.`,
      nzOnOk: () => this.salesService.confirmSalesOrder(order.id).subscribe({
        next: () => { this.message.success('Order confirmed'); this.loadOrders(); }
      })
    });
  }

  cancelOrder(order: SalesOrder): void {
    this.modal.confirm({
      nzTitle: 'Cancel Order',
      nzContent: `Cancel ${order.orderNumber}? This cannot be undone.`,
      nzOkDanger: true,
      nzOnOk: () => this.salesService.cancelSalesOrder(order.id).subscribe({
        next: () => { this.message.success('Order cancelled'); this.loadOrders(); }
      })
    });
  }

  createDelivery(order: SalesOrder): void {
    this.router.navigate(['/sales/delivery/new'], { queryParams: { orderId: order.id } });
  }
}

