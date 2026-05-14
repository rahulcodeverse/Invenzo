import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { PurchasesService } from '../services/purchases.service';
import { PurchaseInvoice } from '../models/purchases.model';

@Component({
  selector: 'app-purchase-invoice-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzIconModule, NzTagModule, NzInputModule, NzSelectModule, NzSpaceModule,
    NzStatisticModule, NzGridModule, NzProgressModule
  ],
  template: `
    <div nz-row [nzGutter]="16" style="margin-bottom:16px">
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="Total Invoices" [nzValue]="total" [nzValueStyle]="{'color': '#c56a1a'}"></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="Pending Amount" [nzValue]="pendingAmount" [nzValueStyle]="{'color': '#faad14'}" nzPrefix="₹" ></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="Paid Amount" [nzValue]="paidAmount" [nzValueStyle]="{'color': '#9a4f12'}" nzPrefix="₹" ></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic nzTitle="Overdue" [nzValue]="overdueCount" [nzValueStyle]="{'color': '#ff4d4f'}"></nz-statistic>
        </nz-card>
      </div>
    </div>

    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Purchase Invoices</h2>
          <p>Track vendor invoices and payments</p>
        </div>
        <div class="filters">
          <nz-select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" nzPlaceHolder="All Status" style="width:140px" nzAllowClear>
            <nz-option nzValue="PENDING" nzLabel="Pending"></nz-option>
            <nz-option nzValue="PARTIAL" nzLabel="Partial"></nz-option>
            <nz-option nzValue="PAID" nzLabel="Paid"></nz-option>
            <nz-option nzValue="OVERDUE" nzLabel="Overdue"></nz-option>
          </nz-select>
        </div>
      </div>

      <nz-table #table [nzData]="invoices" [nzLoading]="loading" [nzTotal]="total"
        [nzPageSize]="pageSize" [(nzPageIndex)]="page" (nzPageIndexChange)="loadData()"
        nzSize="middle" [nzFrontPagination]="false">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Vendor</th>
            <th>Invoice Date</th>
            <th>Due Date</th>
            <th nzAlign="right">Total</th>
            <th nzAlign="right">Paid</th>
            <th nzAlign="right">Balance</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center">Payment</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of table.data">
            <td><strong>{{ inv.invoiceNumber }}</strong></td>
            <td>{{ inv.vendor?.name || '-' }}</td>
            <td>{{ inv.invoiceDate | date:'dd MMM yyyy' }}</td>
            <td [class.overdue]="isOverdue(inv)">{{ inv.dueDate | date:'dd MMM yyyy' }}</td>
            <td nzAlign="right">{{ inv.totalAmount | number:'1.2-2' }}</td>
            <td nzAlign="right" style="color:#9a4f12">{{ inv.paidAmount | number:'1.2-2' }}</td>
            <td nzAlign="right" style="color:#ff4d4f">{{ inv.balanceAmount | number:'1.2-2' }}</td>
            <td nzAlign="center">
              <nz-tag [nzColor]="getStatusColor(inv.status)">{{ inv.status }}</nz-tag>
            </td>
            <td nzAlign="center" style="min-width:100px">
              <nz-progress [nzPercent]="getPaymentPercent(inv)" [nzShowInfo]="false" nzSize="small"></nz-progress>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .filters { display:flex; gap:12px; }
    .overdue { color:#ff4d4f; font-weight:500; }
  `]
})
export class PurchaseInvoiceListComponent implements OnInit {
  invoices: PurchaseInvoice[] = [];
  loading = false;
  total = 0;
  page = 1;
  pageSize = 20;
  statusFilter = '';
  pendingAmount = 0;
  paidAmount = 0;
  overdueCount = 0;

  constructor(private service: PurchasesService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.service.getPurchaseInvoices({ page: this.page, limit: this.pageSize, status: this.statusFilter }).subscribe({
      next: (res: any) => {
        const data = res.data?.data ?? res.data ?? res;
        this.invoices = Array.isArray(data) ? data : data.data ?? [];
        this.total = res.data?.meta?.total ?? res.meta?.total ?? this.invoices.length;
        this.calcStats();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  calcStats() {
    this.pendingAmount = this.invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.balanceAmount ?? 0), 0);
    this.paidAmount = this.invoices.reduce((s, i) => s + Number(i.paidAmount ?? 0), 0);
    this.overdueCount = this.invoices.filter(i => this.isOverdue(i)).length;
  }

  isOverdue(inv: PurchaseInvoice): boolean {
    return inv.status !== 'PAID' && new Date(inv.dueDate) < new Date();
  }

  getStatusColor(s: string): string {
    return { PENDING: 'orange', PARTIAL: 'gold', PAID: 'gold', OVERDUE: 'red' }[s] ?? 'default';
  }

  getPaymentPercent(inv: PurchaseInvoice): number {
    const total = Number(inv.totalAmount ?? 0);
    return total > 0 ? Math.round((Number(inv.paidAmount ?? 0) / total) * 100) : 0;
  }
}
