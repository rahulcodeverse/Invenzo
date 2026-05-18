import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzGridModule,
    NzTableModule,
    NzSpinModule,
    NzIconModule,
    NzDatePickerModule,
    NzButtonModule,
    NzSelectModule,
    NzStatisticModule,
    NzTabsModule,
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Sales Analytics</h2>
          <p>Revenue trends, top products, and customer insights</p>
        </div>
        <div class="filters">
          <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="loadAll()"></nz-range-picker>
          <nz-select [(ngModel)]="groupBy" (ngModelChange)="loadTrend()" class="group-select">
            <nz-option nzValue="day" nzLabel="Daily"></nz-option>
            <nz-option nzValue="week" nzLabel="Weekly"></nz-option>
            <nz-option nzValue="month" nzLabel="Monthly"></nz-option>
          </nz-select>
        </div>
      </div>

      <div nz-row [nzGutter]="16" class="summary-grid" *ngIf="growth">
        <div nz-col [nzXs]="24" [nzMd]="8">
          <nz-card>
            <nz-statistic nzTitle="This Month Revenue" [nzValue]="growth.currentMonth || 0"
              [nzValueStyle]="{ color: '#9a4f12' }" nzPrefix="INR "></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="24" [nzMd]="8">
          <nz-card>
            <nz-statistic nzTitle="Last Month Revenue" [nzValue]="growth.lastMonth || 0"
              [nzValueStyle]="{ color: '#c56a1a' }" nzPrefix="INR "></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzXs]="24" [nzMd]="8">
          <nz-card>
            <nz-statistic nzTitle="MoM Growth" [nzValue]="growth.growthPercent || 0"
              [nzValueStyle]="{ color: (growth.growthPercent || 0) >= 0 ? '#20312a' : '#b42318' }"
              nzSuffix="%"></nz-statistic>
          </nz-card>
        </div>
      </div>

      <nz-tabset>
        <nz-tab nzTitle="Sales Trend">
          <div *ngIf="loadingTrend" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-table *ngIf="!loadingTrend" [nzData]="trend" nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Period</th>
                <th nzAlign="right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of trend">
                <td>{{ item.date || item.period }}</td>
                <td nzAlign="right" class="money">INR {{ item.total || item.revenue || 0 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <nz-tab nzTitle="By Product">
          <div *ngIf="loadingProducts" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-table *ngIf="!loadingProducts" [nzData]="productSales" nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th nzAlign="right">Qty Sold</th>
                <th nzAlign="right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of productSales">
                <td><strong>{{ product.product?.name || product.productName || product.name || '-' }}</strong></td>
                <td>{{ product.product?.sku || product.sku || '-' }}</td>
                <td nzAlign="right">{{ product.quantitySold || product.totalQuantity || 0 | number }}</td>
                <td nzAlign="right" class="money">INR {{ product.revenue || product.totalRevenue || 0 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <nz-tab nzTitle="By Category">
          <div *ngIf="loadingCategories" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-table *ngIf="!loadingCategories" [nzData]="categorySales" nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Category</th>
                <th nzAlign="right">Qty Sold</th>
                <th nzAlign="right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let category of categorySales">
                <td><strong>{{ category.name || category.categoryName || '-' }}</strong></td>
                <td nzAlign="right">{{ category.quantity || category.totalQuantity || 0 | number }}</td>
                <td nzAlign="right" class="money">INR {{ category.revenue || category.totalRevenue || 0 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <nz-tab nzTitle="By Customer">
          <div *ngIf="loadingCustomers" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-table *ngIf="!loadingCustomers" [nzData]="customerSales" nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Customer</th>
                <th nzAlign="right">Invoices</th>
                <th nzAlign="right">Paid</th>
                <th nzAlign="right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let customer of customerSales">
                <td><strong>{{ customer.customer?.name || customer.customerName || customer.name || '-' }}</strong></td>
                <td nzAlign="right">{{ customer.invoiceCount || customer.totalOrders || 0 | number }}</td>
                <td nzAlign="right">INR {{ customer.paid || customer.totalPaid || 0 | number:'1.2-2' }}</td>
                <td nzAlign="right" class="money">INR {{ customer.revenue || customer.totalRevenue || 0 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 16px; }
    .header-left h2 { margin: 0; font-size: 24px; font-weight: 700; }
    .header-left p { margin: 4px 0 0; color: rgba(0,0,0,.45); }
    .filters { display: flex; align-items: center; gap: 8px; }
    .group-select { width: 110px; }
    .summary-grid { margin-bottom: 16px; }
    .loading { display: flex; justify-content: center; padding: 40px; }
    .money { color: #9a4f12; font-weight: 700; }
    @media (max-width: 768px) {
      .page-header { align-items: flex-start; flex-direction: column; }
      .filters { width: 100%; flex-direction: column; align-items: stretch; }
      .group-select { width: 100%; }
    }
  `],
})
export class SalesAnalyticsComponent implements OnInit {
  dateRange: Date[] = [new Date(new Date().getFullYear(), 0, 1), new Date()];
  groupBy = 'month';
  trend: any[] = [];
  productSales: any[] = [];
  categorySales: any[] = [];
  customerSales: any[] = [];
  growth: any = null;
  loadingTrend = false;
  loadingProducts = false;
  loadingCategories = false;
  loadingCustomers = false;

  constructor(private service: ReportsService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get fromDate(): string {
    return this.dateRange?.[0]?.toISOString().split('T')[0] ?? '';
  }

  get toDate(): string {
    return this.dateRange?.[1]?.toISOString().split('T')[0] ?? '';
  }

  loadAll(): void {
    this.loadTrend();
    this.loadProducts();
    this.loadCategories();
    this.loadCustomers();
    this.service.getSalesGrowth().subscribe({
      next: (res: any) => {
        this.growth = res.data ?? res;
      },
      error: () => {},
    });
  }

  loadTrend(): void {
    this.loadingTrend = true;
    this.service.getSalesTrend(this.fromDate, this.toDate, this.groupBy).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.trend = Array.isArray(data) ? data : data?.trend ?? [];
        this.loadingTrend = false;
      },
      error: () => {
        this.loadingTrend = false;
      },
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.service.getProductWiseSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => {
        this.productSales = this.extractArray(res);
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      },
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.service.getCategoryWiseSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => {
        this.categorySales = this.extractArray(res);
        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
      },
    });
  }

  loadCustomers(): void {
    this.loadingCustomers = true;
    this.service.getCustomerWiseSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => {
        this.customerSales = this.extractArray(res);
        this.loadingCustomers = false;
      },
      error: () => {
        this.loadingCustomers = false;
      },
    });
  }

  private extractArray(res: any): any[] {
    const data = res?.data ?? res ?? [];
    return Array.isArray(data) ? data : [];
  }
}
