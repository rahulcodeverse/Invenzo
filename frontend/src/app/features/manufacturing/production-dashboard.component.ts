import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ManufacturingService } from './services/manufacturing.service';

@Component({
  selector: 'app-production-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>Production</h2>
        <p>BOM, routing, work order, and manufacturing visibility.</p>
      </div>
      <div>
        <a nz-button nzType="primary" routerLink="/manufacturing/boms">
          <span nz-icon nzType="apartment"></span>
          Manage BOMs
        </a>
        <a nz-button routerLink="/manufacturing/work-orders" style="margin-left:8px">
          <span nz-icon nzType="tool"></span>
          Work Orders
        </a>
      </div>
    </div>

    <div nz-row [nzGutter]="16" class="summary-row">
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card><nz-statistic nzTitle="Active BOMs" [nzValue]="summary.bomCount || 0"></nz-statistic></nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card><nz-statistic nzTitle="Planned Orders" [nzValue]="summary.planned || 0"></nz-statistic></nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card><nz-statistic nzTitle="WIP" [nzValue]="summary.wip || 0" [nzValueStyle]="{ color: '#c56a1a' }"></nz-statistic></nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card><nz-statistic nzTitle="Completed" [nzValue]="summary.completed || 0" [nzValueStyle]="{ color: '#9a4f12' }"></nz-statistic></nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card><nz-statistic nzTitle="Open Indents" [nzValue]="summary.openIndents || 0" [nzValueStyle]="{ color: '#c56a1a' }"></nz-statistic></nz-card>
      </div>
    </div>

    <div nz-row [nzGutter]="16">
      <div nz-col [nzXs]="24" [nzLg]="12">
        <nz-card nzTitle="Recent BOMs">
          <nz-table [nzData]="boms" nzSize="small" [nzShowPagination]="false">
            <thead><tr><th>BOM</th><th>Finished Good</th><th>Materials</th></tr></thead>
            <tbody>
              <tr *ngFor="let bom of boms">
                <td><strong>{{ bom.bomNumber }}</strong><br><span>{{ bom.name }}</span></td>
                <td>{{ bom.product?.name }}</td>
                <td><nz-tag nzColor="gold">{{ bom.items?.length || 0 }}</nz-tag></td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzLg]="12">
        <nz-card nzTitle="Recent Work Orders">
          <nz-table [nzData]="workOrders" nzSize="small" [nzShowPagination]="false">
            <thead><tr><th>Work Order</th><th>Product</th><th>Status</th><th nzAlign="right">Planned</th></tr></thead>
            <tbody>
              <tr *ngFor="let order of workOrders">
                <td><strong>{{ order.workOrderNumber }}</strong></td>
                <td>{{ order.product?.name }}</td>
                <td><nz-tag [nzColor]="statusColor(order.status)">{{ order.status }}</nz-tag></td>
                <td nzAlign="right">{{ order.plannedQty | number:'1.0-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:750; }
    .page-header p { margin:4px 0 0; color:#6f675f; }
    .summary-row { margin-bottom:16px; }
    @media (max-width: 760px) { .page-header { align-items:flex-start; flex-direction:column; } }
  `],
})
export class ProductionDashboardComponent implements OnInit {
  summary: any = {};
  boms: any[] = [];
  workOrders: any[] = [];

  constructor(private manufacturingService: ManufacturingService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.manufacturingService.getSummary().subscribe(res => this.summary = res.data ?? res);
    this.manufacturingService.getBoms().subscribe(res => this.boms = (res.data?.data ?? res.data ?? []).slice(0, 5));
    this.manufacturingService.getWorkOrders().subscribe(res => this.workOrders = (res.data?.data ?? res.data ?? []).slice(0, 5));
  }

  statusColor(status: string): string {
    return { PLANNED: 'default', RELEASED: 'gold', IN_PROGRESS: 'orange', COMPLETED: 'gold', CANCELLED: 'red' }[status] || 'default';
  }
}
