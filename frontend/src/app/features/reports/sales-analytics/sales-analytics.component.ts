import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-sales-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzGridModule, NzTableModule, NzTagModule,
    NzSpinModule, NzIconModule, NzDatePickerModule, NzButtonModule, NzSelectModule,
    NzStatisticModule, NzTabsModule, NzDividerModule
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
          <nz-select [(ngModel)]="groupBy" (ngModelChange)="loadTrend()" style="width:100px;margin-left:8px">
            <nz-option nzValue="day" nzLabel="Daily"></nz-option>
            <nz-option nzValue="week" nzLabel="Weekly"></nz-option>
            <nz-option nzValue="month" nzLabel="Monthly"></nz-option>
          </nz-select>
        </div>
      </div>

      <!-- Growth Stats -->
      <div nz-row [nzGutter]="16" style="margin-bottom:16px" *ngIf="growth">
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="This Month Revenue" [nzValue]="growth.currentMonth?.revenue || 0"
              [nzValueStyle]="{'color':'#9a4f12'}" nzPrefix="₹" ></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="Last Month Revenue" [nzValue]="growth.previousMonth?.revenue || 0"
              [nzValueStyle]="{'color':'#c56a1a'}" nzPrefix="₹" ></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="MoM Growth" [nzValue]="growth.revenueGrowthPercent || 0"
              [nzValueStyle]="{'color': (growth.revenueGrowthPercent || 0) >= 0 ? '#9a4f12' : '#ff4d4f'}"
              nzSuffix="%" ></nz-statistic>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="6">
          <nz-card>
            <nz-statistic nzTitle="Order Growth" [nzValue]="growth.orderGrowthPercent || 0"
              [nzValueStyle]="{'color': (growth.orderGrowthPercent || 0) >= 0 ? '#9a4f12' : '#ff4d4f'}"
              nzSuffix="%" ></nz-statistic>
          </nz-card>
        </div>
      </div>

      <nz-tabset>
        <!-- Sales Trend -->
        <nz-tab nzTitle="Sales Trend">
          <div *ngIf="loadingTrend" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-table *ngIf="!loadingTrend" [nzData]="trend" nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Period</th>
                <th nzAlign="right">Orders</th>
                <th nzAlign="right">Revenue</th>
                <th nzAlign="right">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of trend">
                <td>{{ t.period }}</td>
                <td nzAlign="right">{{ t.orderCount | number }}</td>
                <td nzAlign="right" style="color:#9a4f12">₹ {{ t.revenue | number:'1.2-2' }}</td>
                <td nzAlign="right">₹ {{ (t.orderCount > 0 ? t.revenue / t.orderCount : 0) | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Product-wise Sales -->
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
              <tr *ngFor="let p of productSales">
                <td><strong>{{ p.productName || p.name }}</strong></td>
                <td>{{ p.sku || '-' }}</td>
                <td nzAlign="right">{{ p.totalQuantity | number }}</td>
                <td nzAlign="right" style="color:#9a4f12">₹ {{ p.totalRevenue | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Category-wise Sales -->
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
              <tr *ngFor="let c of categorySales">
                <td><strong>{{ c.categoryName || c.name }}</strong></td>
                <td nzAlign="right">{{ c.totalQuantity | number }}</td>
                <td nzAlign="right" style="color:#9a4f12">₹ {{ c.totalRevenue | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Customer-wise Sales -->
        <nz-tab nzTitle="By Customer">
          <div *ngIf="loadingCustomers" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-table *ngIf="!loadingCustomers" [nzData]="customerSales" nzSize="middle" [nzShowPagination]="false">
            <thead>
              <tr>
                <th>Customer</th>
                <th nzAlign="right">Orders</th>
                <th nzAlign="right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of customerSales">
                <td><strong>{{ c.customerName || c.name }}</strong></td>
                <td nzAlign="right">{{ c.totalOrders | number }}</td>
                <td nzAlign="right" style="color:#9a4f12">₹ {{ c.totalRevenue | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .filters { display:flex; align-items:center; }
    .loading { display:flex; justify-content:center; padding:40px; }
  `]
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

  ngOnInit() { this.loadAll(); }

  get fromDate(): string { return this.dateRange?.[0]?.toISOString().split('T')[0] ?? ''; }
  get toDate(): string { return this.dateRange?.[1]?.toISOString().split('T')[0] ?? ''; }

  loadAll() {
    this.loadTrend();
    this.loadProducts();
    this.loadCategories();
    this.loadCustomers();
    this.service.getSalesGrowth().subscribe({ next: (res: any) => { this.growth = res.data ?? res; }, error: () => {} });
  }

  loadTrend() {
    this.loadingTrend = true;
    this.service.getSalesTrend(this.fromDate, this.toDate, this.groupBy).subscribe({
      next: (res: any) => { const d = res.data ?? res; this.trend = Array.isArray(d) ? d : []; this.loadingTrend = false; },
      error: () => { this.loadingTrend = false; }
    });
  }

  loadProducts() {
    this.loadingProducts = true;
    this.service.getProductWiseSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => { const d = res.data ?? res; this.productSales = Array.isArray(d) ? d : []; this.loadingProducts = false; },
      error: () => { this.loadingProducts = false; }
    });
  }

  loadCategories() {
    this.loadingCategories = true;
    this.service.getCategoryWiseSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => { const d = res.data ?? res; this.categorySales = Array.isArray(d) ? d : []; this.loadingCategories = false; },
      error: () => { this.loadingCategories = false; }
    });
  }

  loadCustomers() {
    this.loadingCustomers = true;
    this.service.getCustomerWiseSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => { const d = res.data ?? res; this.customerSales = Array.isArray(d) ? d : []; this.loadingCustomers = false; },
      error: () => { this.loadingCustomers = false; }
    });
  }
}
