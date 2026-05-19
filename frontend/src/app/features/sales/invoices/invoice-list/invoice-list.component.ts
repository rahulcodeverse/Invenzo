import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { SalesInvoice } from '../../models/sales.model';
import { Customer } from '../../../../core/models/master-data.model';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzInputModule,
    NzSelectModule, NzTagModule, NzModalModule, NzIconModule, NzSpaceModule,
    NzCardModule, NzBadgeModule,
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Sales Invoices</h2>
          <p>Manage receivables, overdue invoices, and customer payments</p>
        </div>
        <div class="header-right">
          <button nz-button nzType="primary" (click)="navigateToNew()">
            <span nz-icon nzType="plus"></span>
            New Invoice
          </button>
        </div>
      </div>

      <div class="aging-strip">
        <button nz-button [nzType]="selectedStatus === null ? 'primary' : 'default'" (click)="setStatus(null)">All {{ total }}</button>
        <button nz-button [nzType]="selectedStatus === 'PENDING' ? 'primary' : 'default'" (click)="setStatus('PENDING')">Pending {{ countByStatus('PENDING') }}</button>
        <button nz-button [nzType]="selectedStatus === 'PARTIAL' ? 'primary' : 'default'" (click)="setStatus('PARTIAL')">Partial {{ countByStatus('PARTIAL') }}</button>
        <button nz-button [nzType]="selectedStatus === 'OVERDUE' ? 'primary' : 'default'" nzDanger (click)="setStatus('OVERDUE')">Overdue {{ overdueCount }}</button>
      </div>

      <div class="filters-section">
        <nz-space [nzSize]="'middle'">
          <nz-input-group *nzSpaceItem nzSearch [nzAddOnAfter]="suffixIconButton" style="width: 300px;">
            <input type="text" nz-input placeholder="Search..." [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" />
          </nz-input-group>
          <ng-template #suffixIconButton>
            <button nz-button nzType="primary" nzSearch><span nz-icon nzType="search"></span></button>
          </ng-template>

          <nz-select *nzSpaceItem nzAllowClear nzPlaceHolder="Status" [(ngModel)]="selectedStatus"
                     (ngModelChange)="onFilterChange()" style="width: 150px;">
            <nz-option nzLabel="Pending" nzValue="PENDING"></nz-option>
            <nz-option nzLabel="Partial" nzValue="PARTIAL"></nz-option>
            <nz-option nzLabel="Paid" nzValue="PAID"></nz-option>
            <nz-option nzLabel="Overdue" nzValue="OVERDUE"></nz-option>
          </nz-select>

          <nz-select *nzSpaceItem nzShowSearch nzAllowClear nzPlaceHolder="Customer"
                     [(ngModel)]="selectedCustomer" (ngModelChange)="onFilterChange()" style="width: 200px;">
            <nz-option *ngFor="let customer of customers" [nzLabel]="customer.name" [nzValue]="customer.id"></nz-option>
          </nz-select>

          <button *nzSpaceItem nz-button (click)="resetFilters()">
            <span nz-icon nzType="redo"></span>
            Reset
          </button>
        </nz-space>
      </div>

      <nz-table #table [nzData]="invoices" [nzLoading]="loading" [nzTotal]="total"
                [nzPageSize]="pageSize" [nzPageIndex]="pageIndex" [nzFrontPagination]="false"
                (nzPageIndexChange)="onPageChange($event)" (nzPageSizeChange)="onPageSizeChange($event)"
                [nzShowSizeChanger]="true" [nzPageSizeOptions]="[10, 20, 50]">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Invoice Date</th>
            <th>Due Date</th>
            <th nzAlign="right">Total</th>
            <th nzAlign="right">Paid</th>
            <th nzAlign="right">Balance</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="190px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let invoice of table.data" [class.overdue-row]="isOverdue(invoice)">
            <td>
              <nz-tag nzColor="orange">{{ invoice.invoiceNumber }}</nz-tag>
              <small class="due-note" *ngIf="invoice.balanceAmount > 0">{{ getDueLabel(invoice) }}</small>
            </td>
            <td><strong>{{ invoice.customer?.name || '-' }}</strong></td>
            <td>{{ invoice.invoiceDate | date:'dd/MM/yyyy' }}</td>
            <td>{{ invoice.dueDate | date:'dd/MM/yyyy' }}</td>
            <td nzAlign="right"><strong>{{ formatCurrency(invoice.totalAmount) }}</strong></td>
            <td nzAlign="right">{{ formatCurrency(invoice.paidAmount) }}</td>
            <td nzAlign="right">
              <strong [class.text-danger]="invoice.balanceAmount > 0">{{ formatCurrency(invoice.balanceAmount) }}</strong>
            </td>
            <td nzAlign="center">
              <nz-badge [nzStatus]="getStatusBadge(invoice.status)" [nzText]="invoice.status"></nz-badge>
            </td>
            <td nzAlign="center">
              <nz-space>
                <button *nzSpaceItem nz-button nzSize="small" (click)="viewInvoice(invoice)">
                  <span nz-icon nzType="eye"></span>
                </button>
                <button *nzSpaceItem nz-button nzSize="small" (click)="downloadPdf(invoice)">
                  <span nz-icon nzType="download"></span>
                </button>
                <ng-container *nzSpaceItem>
                  <button nz-button nzSize="small" nzType="primary" *ngIf="invoice.balanceAmount > 0" (click)="recordPayment(invoice)">
                    <span nz-icon nzType="dollar"></span>
                    Pay
                  </button>
                </ng-container>
              </nz-space>
            </td>
          </tr>
        </tbody>
      </nz-table>

      <div class="summary-section" *ngIf="invoices.length > 0">
        <nz-space [nzSize]="'large'">
          <div *nzSpaceItem class="summary-item">
            <div class="summary-label">Total Invoiced</div>
            <div class="summary-value">{{ formatCurrency(getTotalInvoiced()) }}</div>
          </div>
          <div *nzSpaceItem class="summary-item">
            <div class="summary-label">Total Paid</div>
            <div class="summary-value text-success">{{ formatCurrency(getTotalPaid()) }}</div>
          </div>
          <div *nzSpaceItem class="summary-item">
            <div class="summary-label">Outstanding</div>
            <div class="summary-value text-danger">{{ formatCurrency(getTotalOutstanding()) }}</div>
          </div>
        </nz-space>
      </div>
    </nz-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .header-left p { margin: 4px 0 0; color: var(--invenzo-muted); }
    .aging-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .filters-section { margin-bottom: 16px; padding: 16px; background: var(--invenzo-surface-soft); border-radius: 4px; }
    .overdue-row { background-color: rgba(255, 77, 79, .12); }
    .due-note { display: block; margin-top: 4px; color: #6f675f; }
    .text-danger { color: #cf1322; }
    .text-success { color: #9a4f12; }
    .summary-section { margin-top: 24px; padding: 16px; background: var(--invenzo-surface-soft); border-radius: 4px; }
    .summary-item { text-align: center; }
    .summary-label { font-size: 12px; color: var(--invenzo-muted); margin-bottom: 4px; }
    .summary-value { font-size: 24px; font-weight: 600; }
    @media (max-width: 680px) {
      .page-header { align-items: flex-start; flex-direction: column; }
    }
  `],
})
export class InvoiceListComponent implements OnInit {
  invoices: SalesInvoice[] = [];
  customers: Customer[] = [];
  loading = false;
  total = 0;
  pageSize = 20;
  pageIndex = 1;
  searchText = '';
  selectedStatus: string | null = null;
  selectedCustomer: string | null = null;
  overdueCount = 0;
  private searchSubject = new Subject<string>();

  constructor(
    private salesService: SalesService,
    private masterDataService: MasterDataService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService,
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => this.loadInvoices());
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.selectedStatus = params.get('status');
      this.pageIndex = 1;
      this.loadInvoices();
    });
    this.loadCustomers();
  }

  loadInvoices(): void {
    this.loading = true;
    this.salesService.getSalesInvoices({
      page: this.pageIndex,
      limit: this.pageSize,
      customerId: this.selectedCustomer || undefined,
      status: this.selectedStatus || undefined,
    }).subscribe({
      next: res => {
        this.invoices = res.data;
        this.total = res.meta.total;
        this.overdueCount = this.invoices.filter(invoice => this.isOverdue(invoice)).length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadCustomers(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: res => { this.customers = res.data; },
    });
  }

  onSearch(value: string): void { this.searchSubject.next(value); }
  onPageChange(page: number): void { this.pageIndex = page; this.loadInvoices(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.pageIndex = 1; this.loadInvoices(); }
  onFilterChange(): void { this.pageIndex = 1; this.loadInvoices(); }
  setStatus(status: string | null): void { this.selectedStatus = status; this.onFilterChange(); }
  resetFilters(): void { this.searchText = ''; this.selectedStatus = null; this.selectedCustomer = null; this.loadInvoices(); }
  navigateToNew(): void { this.router.navigate(['/sales/invoices/new']); }
  viewInvoice(invoice: SalesInvoice): void { this.router.navigate(['/sales/invoices', invoice.id]); }

  getStatusBadge(status: string): 'success' | 'processing' | 'default' | 'error' | 'warning' {
    const badges: any = { PAID: 'success', PARTIAL: 'processing', PENDING: 'warning', OVERDUE: 'error' };
    return badges[status] || 'default';
  }

  recordPayment(invoice: SalesInvoice): void {
    this.router.navigate(['/sales/payments/new'], { queryParams: { invoiceId: invoice.id } });
  }

  downloadPdf(invoice: SalesInvoice): void {
    this.salesService.downloadSalesInvoicePdf(invoice.id).subscribe({
      next: blob => {
        this.savePdf(blob, `sales-invoice-${invoice.invoiceNumber}.pdf`);
        this.message.success('Invoice PDF downloaded');
      },
      error: () => this.message.error('Unable to download invoice PDF'),
    });
  }

  countByStatus(status: string): number {
    return this.invoices.filter(invoice => invoice.status === status).length;
  }

  isOverdue(invoice: SalesInvoice): boolean {
    return invoice.status !== 'PAID' && new Date(invoice.dueDate) < new Date();
  }

  getDueLabel(invoice: SalesInvoice): string {
    const diff = Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    return `Due in ${diff} days`;
  }

  getTotalInvoiced(): number { return this.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0); }
  getTotalPaid(): number { return this.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0); }
  getTotalOutstanding(): number { return this.invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0); }

  formatCurrency(value: number): string {
    return `INR ${Number(value || 0).toLocaleString('en-IN')}`;
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
