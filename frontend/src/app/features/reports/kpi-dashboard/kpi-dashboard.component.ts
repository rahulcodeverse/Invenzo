import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
    CommonModule,
    FormsModule,
    RouterModule,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
    NzSpinModule,
    NzIconModule,
    NzDividerModule,
    NzProgressModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>KPI Dashboard</h2>
        <p>Key performance indicators across revenue, working capital, and stock health</p>
      </div>
      <button nz-button (click)="exportCsv()" [disabled]="loading">
        <span nz-icon nzType="download"></span>
        Export CSV
      </button>
    </div>

    <div *ngIf="loading" class="loading">
      <nz-spin nzTip="Loading KPIs..." nzSize="large"></nz-spin>
    </div>

    <div *ngIf="!loading">
      <div nz-row [nzGutter]="16" class="summary-grid">
        <div nz-col [nzXs]="24" [nzMd]="6">
          <nz-card>
            <nz-statistic nzTitle="Total Revenue" [nzValue]="summary.revenue || 0"
              [nzValueStyle]="{ color: '#9a4f12' }" nzPrefix="INR ">
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="24" [nzMd]="6">
          <nz-card>
            <nz-statistic nzTitle="Receivables" [nzValue]="summary.receivables || 0"
              [nzValueStyle]="{ color: '#c56a1a' }" nzPrefix="INR ">
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="24" [nzMd]="6">
          <nz-card>
            <nz-statistic nzTitle="Payables" [nzValue]="summary.payables || 0"
              [nzValueStyle]="{ color: '#b42318' }" nzPrefix="INR ">
            </nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="24" [nzMd]="6">
          <nz-card>
            <nz-statistic nzTitle="Low Stock Items" [nzValue]="summary.lowStockCount || 0"
              [nzValueStyle]="{ color: (summary.lowStockCount || 0) > 0 ? '#c56a1a' : '#20312a' }">
            </nz-statistic>
          </nz-card>
        </div>
      </div>

      <div nz-row [nzGutter]="16">
        <div nz-col [nzXs]="24" [nzLg]="12">
          <nz-card nzTitle="Top Selling Products">
            <nz-table [nzData]="topProducts" nzSize="small" [nzShowPagination]="false">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th nzAlign="right">Qty Sold</th>
                  <th nzAlign="right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let product of topProducts">
                  <td>
                    <a *ngIf="product.product?.id; else productName" [routerLink]="['/products', product.product.id, 'edit']">
                      {{ product.product?.name || product.productName || product.name || '-' }}
                    </a>
                    <ng-template #productName>{{ product.product?.name || product.productName || product.name || '-' }}</ng-template>
                  </td>
                  <td>{{ product.product?.sku || product.sku || '-' }}</td>
                  <td nzAlign="right">{{ product.quantitySold || product.totalQuantity || 0 | number }}</td>
                  <td nzAlign="right" class="money">INR {{ product.revenue || product.totalRevenue || 0 | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </nz-table>
          </nz-card>
        </div>

        <div nz-col [nzXs]="24" [nzLg]="12">
          <nz-card nzTitle="Top Customers">
            <nz-table [nzData]="topCustomers" nzSize="small" [nzShowPagination]="false">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th nzAlign="right">Invoices</th>
                  <th nzAlign="right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let customer of topCustomers">
                  <td>
                    <a routerLink="/customers">{{ customer.customer?.name || customer.customerName || customer.name || '-' }}</a>
                  </td>
                  <td nzAlign="right">{{ customer.invoiceCount || customer.totalOrders || 0 | number }}</td>
                  <td nzAlign="right" class="money">INR {{ customer.totalRevenue || customer.revenue || 0 | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </nz-table>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; }
    .page-header p { margin: 4px 0 0; color: rgba(0,0,0,.45); }
    .loading { display: flex; justify-content: center; padding: 60px; }
    .summary-grid { margin-bottom: 16px; }
    .money { color: #9a4f12; font-weight: 700; }
    @media (max-width: 680px) {
      .page-header { flex-direction: column; }
    }
  `],
})
export class KpiDashboardComponent implements OnInit {
  loading = true;
  summary: any = {};
  topProducts: any[] = [];
  topCustomers: any[] = [];

  constructor(private service: ReportsService) {}

  ngOnInit(): void {
    Promise.all([
      this.service.getSummaryKpis().toPromise(),
      this.service.getTopProducts(10).toPromise(),
      this.service.getTopCustomers(10).toPromise(),
    ]).then(([summaryRes, productsRes, customersRes]: any[]) => {
      this.summary = summaryRes?.data ?? summaryRes ?? {};
      this.topProducts = this.extractArray(productsRes);
      this.topCustomers = this.extractArray(customersRes);
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  private extractArray(res: any): any[] {
    const data = res?.data ?? res ?? [];
    return Array.isArray(data) ? data : [];
  }

  exportCsv(): void {
    const rows = [
      ['KPI Summary'],
      ['Revenue', 'Profit', 'Receivables', 'Payables', 'Products', 'Low Stock Items'],
      [
        this.summary.revenue || 0,
        this.summary.profit || 0,
        this.summary.receivables || 0,
        this.summary.payables || 0,
        this.summary.totalProducts || 0,
        this.summary.lowStockCount || 0,
      ],
      [],
      ['Top Products'],
      ['Product', 'SKU', 'Quantity Sold', 'Revenue'],
      ...this.topProducts.map(item => [
        item.product?.name || item.productName || item.name || '-',
        item.product?.sku || item.sku || '-',
        item.quantitySold || item.totalQuantity || 0,
        item.revenue || item.totalRevenue || 0,
      ]),
      [],
      ['Top Customers'],
      ['Customer', 'Invoices', 'Revenue'],
      ...this.topCustomers.map(item => [
        item.customer?.name || item.customerName || item.name || '-',
        item.invoiceCount || item.totalOrders || 0,
        item.totalRevenue || item.revenue || 0,
      ]),
    ];

    const csv = rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpi-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: unknown): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }
}
