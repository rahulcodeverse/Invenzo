import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface KpiSummary {
  revenue: number;
  profit: number;
  receivables: number;
  payables: number;
  totalProducts: number;
  lowStockCount: number;
}

interface TopProduct {
  product: { name: string; sku: string };
  quantitySold: number;
  revenue: number;
}

interface ActionQueueItem {
  label: string;
  count: number;
  link: string;
  queryParams: Record<string, string>;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzSpinModule,
    NzButtonModule,
    NgxEchartsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  loading = true;
  kpiData: KpiSummary | null = null;
  topProducts: TopProduct[] = [];
  salesTrendData: any[] = [];
  actionQueue: ActionQueueItem[] = [
    { label: 'Sales orders to confirm', count: 0, link: '/sales/orders', queryParams: { status: 'DRAFT' }, icon: 'file-done' },
    { label: 'Purchase orders to approve', count: 0, link: '/purchases/orders', queryParams: { status: 'DRAFT' }, icon: 'shopping-cart' },
    { label: 'Open purchase indents', count: 0, link: '/manufacturing/indents', queryParams: {}, icon: 'profile' },
    { label: 'Production to release', count: 0, link: '/manufacturing/work-orders', queryParams: {}, icon: 'build' },
  ];

  salesChartOption: EChartsOption = {};
  categoryChartOption: EChartsOption = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    this.http.get<any>(`${environment.apiUrl}/reports/kpi/summary`).subscribe({
      next: response => {
        this.kpiData = response.data ?? response;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });

    this.http.get<any>(`${environment.apiUrl}/reports/kpi/top-products?limit=5`).subscribe({
      next: response => {
        this.topProducts = this.extractArray(response);
      },
      error: () => {
        this.topProducts = [];
      },
    });

    const today = new Date();
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    this.http.get<any>(
      `${environment.apiUrl}/reports/sales/trend?fromDate=${monthAgo.toISOString().split('T')[0]}&toDate=${today.toISOString().split('T')[0]}&groupBy=day`,
    ).subscribe({
      next: response => {
        const data = response.data ?? response;
        this.salesTrendData = Array.isArray(data) ? data : data.trend ?? [];
        this.initSalesChart();
      },
      error: () => {
        this.salesTrendData = [];
        this.initSalesChart();
      },
    });

    this.http.get<any>(
      `${environment.apiUrl}/reports/sales/categories?fromDate=2024-01-01&toDate=${today.toISOString().split('T')[0]}`,
    ).subscribe({
      next: response => {
        this.initCategoryChart(this.extractArray(response));
      },
      error: () => {
        this.initCategoryChart([]);
      },
    });

    this.loadActionQueue();
  }

  loadActionQueue(): void {
    const requests = [
      this.http.get<any>(`${environment.apiUrl}/sales/orders?limit=1&status=DRAFT`),
      this.http.get<any>(`${environment.apiUrl}/purchases/po?limit=1&status=DRAFT`),
      this.http.get<any>(`${environment.apiUrl}/manufacturing/indents?limit=100`),
      this.http.get<any>(`${environment.apiUrl}/manufacturing/work-orders?limit=100`),
    ];

    requests.forEach((request, index) => {
      request.subscribe({
        next: response => {
          const rows = this.extractArray(response);
          if (index === 2) {
            this.actionQueue[index].count = rows.filter(item => item.status === 'OPEN').length;
            return;
          }
          if (index === 3) {
            this.actionQueue[index].count = rows.filter(item => item.status === 'PLANNED').length;
            return;
          }
          this.actionQueue[index].count = this.extractTotal(response, rows);
        },
        error: () => {
          this.actionQueue[index].count = 0;
        },
      });
    });
  }

  initSalesChart(): void {
    const dates = this.salesTrendData.map(item => item.period || item.date);
    const revenues = this.salesTrendData.map(item => item.revenue || item.total || 0);

    this.salesChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const value = params[0].value;
          return `${params[0].axisValue}<br/>Revenue: INR ${value.toLocaleString()}`;
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `INR ${(value / 1000).toFixed(0)}K`,
        },
      },
      series: [
        {
          name: 'Revenue',
          type: 'line',
          smooth: true,
          data: revenues,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(197, 106, 26, 0.28)' },
                { offset: 1, color: 'rgba(197, 106, 26, 0)' },
              ],
            },
          },
          lineStyle: { color: '#c56a1a', width: 2 },
          itemStyle: { color: '#c56a1a' },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
    };
  }

  initCategoryChart(data: any[]): void {
    const categories = data.map(item => item.category?.name || item.name || item.categoryName || 'Unknown');
    const revenues = data.map(item => item.revenue || item.totalRevenue || 0);

    this.categoryChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: INR {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Category Sales',
          type: 'pie',
          radius: '60%',
          data: categories.map((category, index) => ({
            value: revenues[index],
            name: category,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }

  formatCurrency(value: number): string {
    return `INR ${value.toLocaleString('en-IN')}`;
  }

  private extractArray(response: any): any[] {
    const data = response?.data?.data ?? response?.data ?? response ?? [];
    return Array.isArray(data) ? data : [];
  }

  private extractTotal(response: any, rows: any[]): number {
    return response?.data?.meta?.total ?? response?.meta?.total ?? rows.length;
  }
}
