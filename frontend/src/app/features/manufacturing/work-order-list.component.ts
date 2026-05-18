import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ManufacturingService } from './services/manufacturing.service';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTableModule, NzTagModule],
  template: `
    <div class="page-header">
      <h2>Work Orders</h2>
      <p>Plan production, material requirements, WIP, output, rejection, and completion.</p>
    </div>
    <nz-card>
      <nz-table [nzData]="workOrders" [nzLoading]="loading">
        <thead>
          <tr><th>WO No.</th><th>Product</th><th>Warehouse</th><th>Status</th><th nzAlign="right">Planned</th><th nzAlign="right">Produced</th><th>Materials</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of workOrders">
            <td><strong>{{ order.workOrderNumber }}</strong></td>
            <td>{{ order.product?.name }}<br><small>{{ order.product?.sku }}</small></td>
            <td>{{ order.warehouse?.name }}</td>
            <td><nz-tag [nzColor]="statusColor(order.status)">{{ order.status }}</nz-tag></td>
            <td nzAlign="right">{{ order.plannedQty | number:'1.0-2' }}</td>
            <td nzAlign="right">{{ order.producedQty | number:'1.0-2' }}</td>
            <td><nz-tag nzColor="gold">{{ order.materials?.length || 0 }}</nz-tag></td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`.page-header{margin-bottom:20px}.page-header h2{margin:0;font-size:24px;font-weight:750}.page-header p{margin:4px 0 0;color:#6f675f}`],
})
export class WorkOrderListComponent implements OnInit {
  loading = false;
  workOrders: any[] = [];

  constructor(private manufacturingService: ManufacturingService) {}

  ngOnInit(): void {
    this.loading = true;
    this.manufacturingService.getWorkOrders().subscribe({
      next: res => { this.workOrders = res.data?.data ?? res.data ?? []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  statusColor(status: string): string {
    return { PLANNED: 'default', RELEASED: 'gold', IN_PROGRESS: 'orange', COMPLETED: 'gold', CANCELLED: 'red' }[status] || 'default';
  }
}
