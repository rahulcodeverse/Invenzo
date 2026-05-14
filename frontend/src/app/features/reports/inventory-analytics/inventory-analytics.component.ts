import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-inventory-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzGridModule, NzTableModule, NzTagModule,
    NzSpinModule, NzIconModule, NzButtonModule, NzSelectModule, NzStatisticModule,
    NzTabsModule, NzAlertModule, NzProgressModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Inventory Analytics</h2>
          <p>Stock ageing, dead stock, reorder alerts, and expiry tracking</p>
        </div>
        <button nz-button nzType="primary" (click)="loadAll()" [nzLoading]="loading">
          <span nz-icon nzType="reload"></span> Refresh
        </button>
      </div>

      <nz-tabset>

        <!-- Reorder Suggestions -->
        <nz-tab nzTitle="Reorder Alerts">
          <nz-alert *ngIf="reorderItems.length > 0" nzType="warning"
            [nzMessage]="reorderItems.length + ' items need reordering'"
            nzShowIcon style="margin-bottom:16px"></nz-alert>
          <nz-table [nzData]="reorderItems" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th nzAlign="right">Current Stock</th>
                <th nzAlign="right">Reorder Level</th>
                <th nzAlign="right">Reorder Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of reorderItems">
                <td><strong>{{ item.productName || item.product?.name }}</strong></td>
                <td>{{ item.sku || item.product?.sku || '-' }}</td>
                <td>{{ item.warehouseName || item.warehouse?.name || '-' }}</td>
                <td nzAlign="right" style="color:#ff4d4f;font-weight:600">{{ item.quantity | number }}</td>
                <td nzAlign="right">{{ item.reorderLevel | number }}</td>
                <td nzAlign="right" style="color:#faad14">{{ item.reorderQuantity | number }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Stock Ageing -->
        <nz-tab nzTitle="Stock Ageing">
          <nz-table [nzData]="ageing" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th nzAlign="right">Qty</th>
                <th nzAlign="right">Days in Stock</th>
                <th nzAlign="center">Age Bracket</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of ageing">
                <td><strong>{{ item.productName || item.product?.name }}</strong></td>
                <td>{{ item.warehouseName || item.warehouse?.name || '-' }}</td>
                <td nzAlign="right">{{ item.quantity | number }}</td>
                <td nzAlign="right">{{ item.daysInStock | number }}</td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="getAgeBracketColor(item.ageBracket)">{{ item.ageBracket }}</nz-tag>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Dead Stock -->
        <nz-tab nzTitle="Dead Stock">
          <nz-table [nzData]="deadStock" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th nzAlign="right">Qty</th>
                <th nzAlign="right">Days Since Movement</th>
                <th nzAlign="right">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of deadStock">
                <td><strong>{{ item.productName || item.product?.name }}</strong></td>
                <td>{{ item.warehouseName || item.warehouse?.name || '-' }}</td>
                <td nzAlign="right">{{ item.quantity | number }}</td>
                <td nzAlign="right" style="color:#ff4d4f">{{ item.daysSinceLastMovement | number }}</td>
                <td nzAlign="right">₹ {{ item.stockValue | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Expiry Report -->
        <nz-tab nzTitle="Expiry Alerts">
          <nz-alert *ngIf="expiryItems.length > 0" nzType="error"
            [nzMessage]="expiryItems.length + ' batches expiring soon'"
            nzShowIcon style="margin-bottom:16px"></nz-alert>
          <nz-table [nzData]="expiryItems" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch #</th>
                <th>Warehouse</th>
                <th nzAlign="right">Qty</th>
                <th nzAlign="right">Expiry Date</th>
                <th nzAlign="right">Days Left</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of expiryItems">
                <td><strong>{{ item.productName || item.product?.name }}</strong></td>
                <td>{{ item.batchNumber || '-' }}</td>
                <td>{{ item.warehouseName || item.warehouse?.name || '-' }}</td>
                <td nzAlign="right">{{ item.quantity | number }}</td>
                <td nzAlign="right">{{ item.expiryDate | date:'dd MMM yyyy' }}</td>
                <td nzAlign="right" [style.color]="item.daysUntilExpiry <= 7 ? '#ff4d4f' : '#faad14'">
                  {{ item.daysUntilExpiry | number }}
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <!-- Warehouse Summary -->
        <nz-tab nzTitle="By Warehouse">
          <nz-table [nzData]="warehouseStock" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th nzAlign="right">Products</th>
                <th nzAlign="right">Total Qty</th>
                <th nzAlign="right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of warehouseStock">
                <td><strong>{{ w.warehouseName || w.warehouse?.name }}</strong></td>
                <td nzAlign="right">{{ w.productCount | number }}</td>
                <td nzAlign="right">{{ w.totalQuantity | number }}</td>
                <td nzAlign="right" style="color:#1890ff">₹ {{ w.totalValue | number:'1.2-2' }}</td>
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
  `]
})
export class InventoryAnalyticsComponent implements OnInit {
  loading = false;
  ageing: any[] = [];
  deadStock: any[] = [];
  reorderItems: any[] = [];
  expiryItems: any[] = [];
  warehouseStock: any[] = [];

  constructor(private service: ReportsService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    Promise.all([
      this.service.getStockAgeing().toPromise(),
      this.service.getDeadStock(90).toPromise(),
      this.service.getReorderSuggestions().toPromise(),
      this.service.getBatchExpiryReport(30).toPromise(),
      this.service.getWarehouseWiseStock().toPromise()
    ]).then(([ageingRes, deadRes, reorderRes, expiryRes, warehouseRes]: any[]) => {
      this.ageing = this.extractArray(ageingRes);
      this.deadStock = this.extractArray(deadRes);
      this.reorderItems = this.extractArray(reorderRes);
      this.expiryItems = this.extractArray(expiryRes);
      this.warehouseStock = this.extractArray(warehouseRes);
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  extractArray(res: any): any[] {
    const d = res?.data ?? res ?? [];
    return Array.isArray(d) ? d : [];
  }

  getAgeBracketColor(bracket: string): string {
    return { '0-30 days': 'green', '31-60 days': 'blue', '61-90 days': 'orange', '90+ days': 'red' }[bracket] ?? 'default';
  }
}
