import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzGridModule, NzStatisticModule,
    NzTableModule, NzTagModule, NzSpinModule, NzIconModule, NzDividerModule, NzProgressModule
  ],
  template: `
    <div class="page-header">
      <h2>KPI Dashboard</h2>
      <p>Key Performance Indicators</p>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
      <nz-spin nzTip="Loading KPIs..." nzSize="large"></nz-spin>
    </div>

    <div *ngIf="!loading">
      <!-- Summary KPIs -->
      <div nz-row [nzGutter]="16" style="margin-bottom:16px">
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="Total Revenue" [nzValue]="summary.totalRevenue || 0"
              [nzValueStyle]="{'color':'#9a4f12'}" nzPrefix="₹" >
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="Receivables" [nzValue]="summary.totalReceivables || 0"
              [nzValueStyle]="{'color':'#c56a1a'}" nzPrefix="₹" >
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="Payables" [nzValue]="summary.totalPayables || 0"
              [nzValueStyle]="{'color':'#ff4d4f'}" nzPrefix="₹" >
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="Low Stock Items" [nzValue]="summary.lowStockCount || 0"
              [nzValueStyle]="{'color': (summary.lowStockCount || 0) > 0 ? '#faad14' : '#9a4f12'}">
            </nz-statistic>
          </nz-card>
        </div>
      </div>

      <div nz-row [nzGutter]="16">
        <!-- Top Products -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="Top Selling Products">
            <nz-table [nzData]="topProducts" nzSize="small" [nzShowPagination]="false">
              <thead>
                <tr>
                  <th>Product</th>
                  <th nzAlign="right">Qty Sold</th>
                  <th nzAlign="right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of topProducts">
                  <td>{{ p.productName || p.name }}</td>
                  <td nzAlign="right">{{ p.totalQuantity | number }}</td>
                  <td nzAlign="right" style="color:#9a4f12">₹ {{ p.totalRevenue | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </nz-table>
          </nz-card>
        </div>

        <!-- Top Customers -->
        <div nz-col [nzSpan]="12">
          <nz-card nzTitle="Top Customers">
            <nz-table [nzData]="topCustomers" nzSize="small" [nzShowPagination]="false">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th nzAlign="right">Orders</th>
                  <th nzAlign="right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of topCustomers">
                  <td>{{ c.customerName || c.name }}</td>
                  <td nzAlign="right">{{ c.totalOrders | number }}</td>
                  <td nzAlign="right" style="color:#9a4f12">₹ {{ c.totalRevenue | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </nz-table>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom:24px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:600; }
    .page-header p { margin:4px 0 0; color:rgba(0,0,0,.45); }
  `]
})
export class KpiDashboardComponent implements OnInit {
  loading = true;
  summary: any = {};
  topProducts: any[] = [];
  topCustomers: any[] = [];

  constructor(private service: ReportsService) {}

  ngOnInit() {
    Promise.all([
      this.service.getSummaryKpis().toPromise(),
      this.service.getTopProducts(10).toPromise(),
      this.service.getTopCustomers(10).toPromise()
    ]).then(([summaryRes, productsRes, customersRes]: any[]) => {
      this.summary = summaryRes?.data ?? summaryRes ?? {};
      const pd = productsRes?.data ?? productsRes ?? [];
      this.topProducts = Array.isArray(pd) ? pd : [];
      const cd = customersRes?.data ?? customersRes ?? [];
      this.topCustomers = Array.isArray(cd) ? cd : [];
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }
}
