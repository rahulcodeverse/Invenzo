import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-inventory-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzTableModule,
    NzTagModule,
    NzSpinModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzAlertModule,
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Inventory Analytics</h2>
          <p>Stock ageing, dead stock, reorder alerts, and expiry tracking</p>
        </div>
        <button nz-button nzType="primary" (click)="loadAll()" [nzLoading]="loading">
          <span nz-icon nzType="reload"></span>
          Refresh
        </button>
      </div>

      <nz-tabset>
        <nz-tab nzTitle="Reorder Alerts">
          <nz-alert *ngIf="reorderItems.length > 0" nzType="warning"
            [nzMessage]="reorderItems.length + ' items need reordering'"
            nzShowIcon class="tab-alert"></nz-alert>
          <nz-table [nzData]="reorderItems" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th nzAlign="right">Current Stock</th>
                <th nzAlign="right">Reorder Level</th>
                <th nzAlign="right">Suggested Qty</th>
                <th nzAlign="right">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of reorderItems">
                <td><strong>{{ item.product?.name || item.productName || '-' }}</strong></td>
                <td>{{ item.product?.sku || item.sku || '-' }}</td>
                <td>{{ item.warehouse?.name || item.warehouseName || '-' }}</td>
                <td nzAlign="right" class="danger">{{ item.currentStock || item.quantity || 0 | number }}</td>
                <td nzAlign="right">{{ item.reorderLevel || item.product?.reorderLevel || 0 | number }}</td>
                <td nzAlign="right" class="warning">{{ item.suggestedOrderQty || item.reorderQuantity || 0 | number }}</td>
                <td nzAlign="right">INR {{ item.estimatedCost || 0 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <nz-tab nzTitle="Stock Ageing">
          <nz-table [nzData]="ageing" nzSize="middle" [nzShowPagination]="false" [nzLoading]="loading">
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th nzAlign="right">Qty</th>
                <th nzAlign="right">Value</th>
                <th nzAlign="right">Days in Stock</th>
                <th nzAlign="center">Age Bracket</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of ageing">
                <td><strong>{{ item.product?.name || item.productName || '-' }}</strong></td>
                <td>{{ item.warehouse?.name || item.warehouseName || '-' }}</td>
                <td nzAlign="right">{{ item.quantity || 0 | number }}</td>
                <td nzAlign="right">INR {{ item.value || 0 | number:'1.2-2' }}</td>
                <td nzAlign="right">{{ item.daysInStock || 0 | number }}</td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="getAgeBracketColor(item.ageingBucket || item.ageBracket)">
                    {{ item.ageingBucket || item.ageBracket || '-' }}
                  </nz-tag>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

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
                <td><strong>{{ item.product?.name || item.productName || '-' }}</strong></td>
                <td>{{ item.warehouse?.name || item.warehouseName || '-' }}</td>
                <td nzAlign="right">{{ item.quantity || 0 | number }}</td>
                <td nzAlign="right" class="danger">{{ item.daysSinceMovement || item.daysSinceLastMovement || 0 | number }}</td>
                <td nzAlign="right">INR {{ item.value || item.stockValue || 0 | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <nz-tab nzTitle="Expiry Alerts">
          <nz-alert *ngIf="expiryItems.length > 0" nzType="error"
            [nzMessage]="expiryItems.length + ' batches expiring soon'"
            nzShowIcon class="tab-alert"></nz-alert>
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
                <td><strong>{{ item.product?.name || item.productName || '-' }}</strong></td>
                <td>{{ item.batchNumber || '-' }}</td>
                <td>{{ item.warehouse?.name || item.warehouseName || '-' }}</td>
                <td nzAlign="right">{{ item.quantity || 0 | number }}</td>
                <td nzAlign="right">{{ item.expiryDate | date:'dd MMM yyyy' }}</td>
                <td nzAlign="right" [class.danger]="(item.daysUntilExpiry || 0) <= 7" [class.warning]="(item.daysUntilExpiry || 0) > 7">
                  {{ item.daysUntilExpiry || 0 | number }}
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

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
              <tr *ngFor="let warehouse of warehouseStock">
                <td><strong>{{ warehouse.warehouse?.name || warehouse.warehouseName || '-' }}</strong></td>
                <td nzAlign="right">{{ warehouse.totalItems || warehouse.productCount || 0 | number }}</td>
                <td nzAlign="right">{{ warehouse.totalQuantity || 0 | number }}</td>
                <td nzAlign="right" class="money">INR {{ warehouse.totalCostValue || warehouse.totalValue || 0 | number:'1.2-2' }}</td>
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
    .tab-alert { margin-bottom: 16px; }
    .money { color: #c56a1a; font-weight: 700; }
    .warning { color: #c56a1a; font-weight: 700; }
    .danger { color: #b42318; font-weight: 700; }
    @media (max-width: 680px) {
      .page-header { align-items: flex-start; flex-direction: column; }
    }
  `],
})
export class InventoryAnalyticsComponent implements OnInit {
  loading = false;
  ageing: any[] = [];
  deadStock: any[] = [];
  reorderItems: any[] = [];
  expiryItems: any[] = [];
  warehouseStock: any[] = [];

  constructor(private service: ReportsService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    Promise.all([
      this.service.getStockAgeing().toPromise(),
      this.service.getDeadStock(90).toPromise(),
      this.service.getReorderSuggestions().toPromise(),
      this.service.getBatchExpiryReport(30).toPromise(),
      this.service.getWarehouseWiseStock().toPromise(),
    ]).then(([ageingRes, deadRes, reorderRes, expiryRes, warehouseRes]: any[]) => {
      this.ageing = this.extractArray(ageingRes);
      this.deadStock = this.extractArray(deadRes);
      this.reorderItems = this.extractArray(reorderRes);
      this.expiryItems = this.extractArray(expiryRes);
      this.warehouseStock = this.extractArray(warehouseRes);
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  getAgeBracketColor(bracket: string): string {
    return {
      '0-30 days': 'green',
      '31-60 days': 'gold',
      '61-90 days': 'orange',
      '90+ days': 'red',
    }[bracket] ?? 'default';
  }

  private extractArray(res: any): any[] {
    const data = res?.data ?? res ?? [];
    return Array.isArray(data) ? data : [];
  }
}
