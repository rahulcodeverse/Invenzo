import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ManufacturingService } from './services/manufacturing.service';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzCardModule, NzSpaceModule, NzTableModule, NzTagModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Work Orders</h2>
        <p>Plan production, material requirements, WIP, output, rejection, and completion.</p>
      </div>
      <div class="status-summary">
        <button nz-button [nzType]="statusFilter === '' ? 'primary' : 'default'" (click)="filterBy('')">All</button>
        <button nz-button [nzType]="statusFilter === 'PLANNED' ? 'primary' : 'default'" (click)="filterBy('PLANNED')">
          Planned {{ countByStatus('PLANNED') }}
        </button>
        <button nz-button [nzType]="statusFilter === 'IN_PROGRESS' ? 'primary' : 'default'" (click)="filterBy('IN_PROGRESS')">
          In Progress {{ countByStatus('IN_PROGRESS') }}
        </button>
      </div>
    </div>

    <nz-card>
      <nz-table [nzData]="filteredWorkOrders" [nzLoading]="loading">
        <thead>
          <tr>
            <th>WO No.</th>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Status</th>
            <th nzAlign="right">Planned</th>
            <th nzAlign="right">Produced</th>
            <th>Materials</th>
            <th nzAlign="center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of filteredWorkOrders">
            <td><strong>{{ order.workOrderNumber }}</strong></td>
            <td>{{ order.product?.name }}<br><small>{{ order.product?.sku }}</small></td>
            <td>{{ order.warehouse?.name }}</td>
            <td><nz-tag [nzColor]="statusColor(order.status)">{{ order.status }}</nz-tag></td>
            <td nzAlign="right">{{ order.plannedQty | number:'1.0-2' }}</td>
            <td nzAlign="right">{{ order.producedQty | number:'1.0-2' }}</td>
            <td><nz-tag nzColor="gold">{{ order.materials?.length || 0 }}</nz-tag></td>
            <td nzAlign="center">
              <nz-space>
                <ng-container *nzSpaceItem>
                  <button nz-button nzSize="small" *ngIf="order.status === 'PLANNED'" (click)="updateStatus(order, 'RELEASED')">
                    Release
                  </button>
                </ng-container>
                <ng-container *nzSpaceItem>
                  <button nz-button nzSize="small" nzType="primary" *ngIf="order.status === 'RELEASED'" (click)="updateStatus(order, 'IN_PROGRESS')">
                    Start
                  </button>
                </ng-container>
                <ng-container *nzSpaceItem>
                  <button nz-button nzSize="small" nzType="primary" *ngIf="order.status === 'IN_PROGRESS'" (click)="complete(order)">
                    Complete
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
    .page-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 750; }
    .page-header p { margin: 4px 0 0; color: #6f675f; }
    .status-summary { display: flex; gap: 8px; flex-wrap: wrap; }
    @media (max-width: 680px) {
      .page-header { flex-direction: column; }
    }
  `],
})
export class WorkOrderListComponent implements OnInit {
  loading = false;
  statusFilter = '';
  workOrders: any[] = [];

  constructor(
    private manufacturingService: ManufacturingService,
    private message: NzMessageService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredWorkOrders(): any[] {
    return this.statusFilter
      ? this.workOrders.filter(order => order.status === this.statusFilter)
      : this.workOrders;
  }

  load(): void {
    this.loading = true;
    this.manufacturingService.getWorkOrders().subscribe({
      next: res => {
        this.workOrders = res.data?.data ?? res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterBy(status: string): void {
    this.statusFilter = status;
  }

  countByStatus(status: string): number {
    return this.workOrders.filter(order => order.status === status).length;
  }

  updateStatus(order: any, status: string): void {
    this.manufacturingService.updateWorkOrder(order.id, { status }).subscribe({
      next: () => {
        this.message.success(`Work order ${status.toLowerCase().replace('_', ' ')}`);
        this.load();
      },
      error: error => this.message.error(error.error?.message ?? 'Unable to update work order'),
    });
  }

  complete(order: any): void {
    this.modal.confirm({
      nzTitle: 'Complete Work Order',
      nzContent: `Mark ${order.workOrderNumber} as completed with produced quantity ${order.producedQty || order.plannedQty}?`,
      nzOkText: 'Complete',
      nzOnOk: () => this.manufacturingService.updateWorkOrder(order.id, {
        status: 'COMPLETED',
        producedQty: Number(order.producedQty || order.plannedQty || 0),
      }).subscribe({
        next: () => {
          this.message.success('Work order completed');
          this.load();
        },
        error: error => this.message.error(error.error?.message ?? 'Unable to complete work order'),
      }),
    });
  }

  statusColor(status: string): string {
    return {
      PLANNED: 'default',
      RELEASED: 'gold',
      IN_PROGRESS: 'orange',
      COMPLETED: 'green',
      CANCELLED: 'red',
    }[status] || 'default';
  }
}
