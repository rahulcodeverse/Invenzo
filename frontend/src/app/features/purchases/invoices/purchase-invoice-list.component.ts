import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PurchasesService } from '../services/purchases.service';
import { PurchaseInvoice } from '../models/purchases.model';

@Component({
  selector: 'app-purchase-invoice-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, NzCardModule, NzTableModule, NzButtonModule,
    NzIconModule, NzTagModule, NzSelectModule, NzSpaceModule, NzStatisticModule,
    NzGridModule, NzProgressModule,
  ],
  template: `
    <div nz-row [nzGutter]="16" class="summary-grid">
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card>
          <nz-statistic nzTitle="Total Invoices" [nzValue]="total" [nzValueStyle]="{ color: '#c56a1a' }"></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card>
          <nz-statistic nzTitle="Pending Amount" [nzValue]="pendingAmount" [nzValueStyle]="{ color: '#c56a1a' }" nzPrefix="INR "></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card>
          <nz-statistic nzTitle="Paid Amount" [nzValue]="paidAmount" [nzValueStyle]="{ color: '#9a4f12' }" nzPrefix="INR "></nz-statistic>
        </nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="6">
        <nz-card>
          <nz-statistic nzTitle="Overdue" [nzValue]="overdueCount" [nzValueStyle]="{ color: '#b42318' }"></nz-statistic>
        </nz-card>
      </div>
    </div>

    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Purchase Invoices</h2>
          <p>Track payables, due dates, and vendor payment actions</p>
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

      <div class="aging-strip">
        <button nz-button [nzType]="!statusFilter ? 'primary' : 'default'" (click)="setStatus('')">All {{ total }}</button>
        <button nz-button [nzType]="statusFilter === 'PENDING' ? 'primary' : 'default'" (click)="setStatus('PENDING')">Pending {{ countByStatus('PENDING') }}</button>
        <button nz-button [nzType]="statusFilter === 'PARTIAL' ? 'primary' : 'default'" (click)="setStatus('PARTIAL')">Partial {{ countByStatus('PARTIAL') }}</button>
        <button nz-button [nzType]="statusFilter === 'OVERDUE' ? 'primary' : 'default'" nzDanger (click)="setStatus('OVERDUE')">Overdue {{ overdueCount }}</button>
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
            <th nzAlign="center" nzWidth="160px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of table.data" [class.overdue-row]="isOverdue(inv)">
            <td>
              <strong>{{ inv.invoiceNumber }}</strong>
              <small class="due-note" *ngIf="inv.balanceAmount > 0">{{ getDueLabel(inv) }}</small>
            </td>
            <td>{{ inv.vendor?.name || '-' }}</td>
            <td>{{ inv.invoiceDate | date:'dd MMM yyyy' }}</td>
            <td [class.overdue]="isOverdue(inv)">{{ inv.dueDate | date:'dd MMM yyyy' }}</td>
            <td nzAlign="right">{{ formatCurrency(inv.totalAmount) }}</td>
            <td nzAlign="right" class="success">{{ formatCurrency(inv.paidAmount) }}</td>
            <td nzAlign="right" class="danger">{{ formatCurrency(inv.balanceAmount) }}</td>
            <td nzAlign="center">
              <nz-tag [nzColor]="getStatusColor(inv.status)">{{ inv.status }}</nz-tag>
            </td>
            <td nzAlign="center" style="min-width:100px">
              <nz-progress [nzPercent]="getPaymentPercent(inv)" [nzShowInfo]="false" nzSize="small"></nz-progress>
            </td>
            <td nzAlign="center">
              <nz-space>
                <button *nzSpaceItem nz-button nzSize="small" (click)="downloadPdf(inv)">
                  <span nz-icon nzType="download"></span>
                </button>
                <ng-container *nzSpaceItem>
                  <a nz-button nzType="primary" nzSize="small" *ngIf="inv.balanceAmount > 0"
                     routerLink="/purchases/payments" [queryParams]="{ invoiceId: inv.id }">
                    <span nz-icon nzType="dollar"></span>
                    Pay
                  </a>
                </ng-container>
              </nz-space>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .summary-grid { margin-bottom: 16px; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .filters { display:flex; gap:12px; }
    .aging-strip { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
    .overdue-row { background:#fff1f0; }
    .overdue, .danger { color:#b42318; font-weight:600; }
    .success { color:#9a4f12; font-weight:600; }
    .due-note { display:block; margin-top:4px; color:#6f675f; }
    @media (max-width: 680px) {
      .page-header { align-items:flex-start; flex-direction:column; }
    }
  `],
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

  constructor(
    private service: PurchasesService,
    private message: NzMessageService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.statusFilter = params.get('status') ?? '';
      this.page = 1;
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.service.getPurchaseInvoices({ page: this.page, limit: this.pageSize, status: this.statusFilter }).subscribe({
      next: (res: any) => {
        const data = res.data?.data ?? res.data ?? res;
        this.invoices = Array.isArray(data) ? data : data.data ?? [];
        this.total = res.data?.meta?.total ?? res.meta?.total ?? this.invoices.length;
        this.calcStats();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  setStatus(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.loadData();
  }

  calcStats(): void {
    this.pendingAmount = this.invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.balanceAmount ?? 0), 0);
    this.paidAmount = this.invoices.reduce((s, i) => s + Number(i.paidAmount ?? 0), 0);
    this.overdueCount = this.invoices.filter(i => this.isOverdue(i)).length;
  }

  countByStatus(status: string): number {
    return this.invoices.filter(invoice => invoice.status === status).length;
  }

  isOverdue(inv: PurchaseInvoice): boolean {
    return inv.status !== 'PAID' && new Date(inv.dueDate) < new Date();
  }

  getDueLabel(inv: PurchaseInvoice): string {
    const diff = Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    return `Due in ${diff} days`;
  }

  getStatusColor(s: string): string {
    return { PENDING: 'orange', PARTIAL: 'gold', PAID: 'green', OVERDUE: 'red' }[s] ?? 'default';
  }

  getPaymentPercent(inv: PurchaseInvoice): number {
    const total = Number(inv.totalAmount ?? 0);
    return total > 0 ? Math.round((Number(inv.paidAmount ?? 0) / total) * 100) : 0;
  }

  formatCurrency(value: number): string {
    return `INR ${Number(value || 0).toLocaleString('en-IN')}`;
  }

  downloadPdf(inv: PurchaseInvoice): void {
    this.service.downloadPurchaseInvoicePdf(inv.id).subscribe({
      next: blob => {
        this.savePdf(blob, `purchase-invoice-${inv.invoiceNumber}.pdf`);
        this.message.success('Purchase invoice PDF downloaded');
      },
      error: () => this.message.error('Unable to download purchase invoice PDF'),
    });
  }

  private savePdf(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
