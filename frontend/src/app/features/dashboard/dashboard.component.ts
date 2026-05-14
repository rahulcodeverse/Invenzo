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
  finance: {
    totalRevenue: number;
    totalPurchases: number;
    outstandingReceivables: number;
    outstandingPayables: number;
    grossProfit: number;
  };
  inventory: {
    totalValue: number;
    productCount: number;
  };
  business: {
    customerCount: number;
    vendorCount: number;
  };
}

interface TopProduct {
  product: { name: string; sku: string };
  quantitySold: number;
  revenue: number;
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
    NgxEchartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = true;
  kpiData: KpiSummary | null = null;
  topProducts: TopProduct[] = [];
  salesTrendData: any[] = [];

  salesChartOption: EChartsOption = {};
  categoryChartOption: EChartsOption = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load KPI Summary
    this.http.get<any>(`${environment.apiUrl}/reports/kpi/summary`).subscribe({
      next: (response) => {
        this.kpiData = response;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Load Top Products
    this.http.get<any>(`${environment.apiUrl}/reports/kpi/top-products?limit=5`).subscribe({
      next: (response) => {
        // Ensure we get an array
        this.topProducts = Array.isArray(response) ? response : (response.data || []);
      },
      error: () => {
        this.topProducts = [];
      }
    });

    // Load Sales Trend
    const today = new Date();
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    this.http.get<any>(
      `${environment.apiUrl}/reports/sales/trend?fromDate=${monthAgo.toISOString().split('T')[0]}&toDate=${today.toISOString().split('T')[0]}&groupBy=day`
    ).subscribe({
      next: (response) => {
        // Ensure we get an array
        this.salesTrendData = Array.isArray(response) ? response : (response.data || []);
        this.initSalesChart();
      },
      error: (err) => {
        console.error('Error loading sales trend:', err);
        this.salesTrendData = [];
        this.initSalesChart();
      }
    });

    // Load Category Sales
    this.http.get<any>(
      `${environment.apiUrl}/reports/sales/categories?fromDate=2024-01-01&toDate=${today.toISOString().split('T')[0]}`
    ).subscribe({
      next: (response) => {
        // Ensure we get an array
        const data = Array.isArray(response) ? response : (response.data || []);
        this.initCategoryChart(data);
      },
      error: (err) => {
        console.error('Error loading category sales:', err);
        this.initCategoryChart([]);
      }
    });
  }

  initSalesChart(): void {
    if (!Array.isArray(this.salesTrendData)) {
      console.warn('Sales trend data is not an array:', this.salesTrendData);
      this.salesTrendData = [];
    }

    const dates = this.salesTrendData.map(item => item.period);
    const revenues = this.salesTrendData.map(item => item.revenue);

    this.salesChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const value = params[0].value;
          return `${params[0].axisValue}<br/>Revenue: ₹${value.toLocaleString()}`;
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `₹${(value / 1000).toFixed(0)}K`
        }
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
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0)' }
              ]
            }
          },
          lineStyle: {
            color: '#1890ff',
            width: 2
          },
          itemStyle: {
            color: '#1890ff'
          }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      }
    };
  }

  initCategoryChart(data: any[]): void {
    if (!Array.isArray(data)) {
      console.warn('Category data is not an array:', data);
      data = [];
    }

    const categories = data.map(item => item.category?.name || 'Unknown');
    const revenues = data.map(item => item.revenue || 0);

    this.categoryChartOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ₹{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: 'Category Sales',
          type: 'pie',
          radius: '60%',
          data: categories.map((cat, index) => ({
            value: revenues[index],
            name: cat
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  }

  formatCurrency(value: number): string {
    return `₹${value.toLocaleString('en-IN')}`;
  }
}

