import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { MasterDataService } from '../../../core/services/master-data.service';
import { Vendor } from '../../../core/models/master-data.model';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzModalModule, NzFormModule, NzInputModule, NzInputNumberModule, NzSwitchModule,
    NzIconModule, NzTagModule, NzSpaceModule, NzGridModule, NzStatisticModule, NzTabsModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Vendors</h2>
          <p>Manage vendor/supplier database</p>
        </div>
        <div class="header-right">
          <nz-input-group nzSearch [nzAddOnAfter]="suffixIconButton" style="width: 300px; margin-right: 16px;">
            <input type="text" nz-input placeholder="Search vendors..." [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" />
          </nz-input-group>
          <ng-template #suffixIconButton>
            <button nz-button nzType="primary" nzSearch><span nz-icon nzType="search"></span></button>
          </ng-template>
          <button nz-button nzType="primary" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span>
            Add Vendor
          </button>
        </div>
      </div>

      <nz-table #table [nzData]="vendors" [nzLoading]="loading" [nzTotal]="total"
                [nzPageSize]="pageSize" [nzPageIndex]="pageIndex" [nzFrontPagination]="false"
                (nzPageIndexChange)="onPageChange($event)" (nzPageSizeChange)="onPageSizeChange($event)"
                [nzShowSizeChanger]="true" [nzPageSizeOptions]="[10, 20, 50]" nzSize="middle">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Contact</th>
            <th>GST Number</th>
            <th nzAlign="right">Credit Limit</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="190px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of table.data">
            <td><nz-tag nzColor="volcano">{{ item.code }}</nz-tag></td>
            <td><strong>{{ item.name }}</strong></td>
            <td>{{ item.phone || item.email || '-' }}</td>
            <td>{{ item.gstNumber || '-' }}</td>
            <td nzAlign="right">{{ item.creditLimit ? '₹' + item.creditLimit.toLocaleString() : '-' }}</td>
            <td nzAlign="center">
              <nz-tag [nzColor]="item.isActive ? 'gold' : 'red'">
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </nz-tag>
            </td>
            <td nzAlign="center">
              <nz-space>
                <button *nzSpaceItem nz-button nzType="default" nzSize="small" (click)="openEditModal(item)">
                  <span nz-icon nzType="edit"></span>
                </button>
                <button *nzSpaceItem nz-button nzType="default" nzSize="small" (click)="openStatement(item)">
                  <span nz-icon nzType="profile"></span>
                  Statement
                </button>
                <button *nzSpaceItem nz-button nzType="default" nzDanger nzSize="small" (click)="confirmDelete(item)">
                  <span nz-icon nzType="delete"></span>
                </button>
              </nz-space>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>

    <nz-modal [(nzVisible)]="modalVisible" [nzTitle]="modalTitle" (nzOnCancel)="handleModalCancel()"
              (nzOnOk)="handleModalOk()" nzWidth="700px">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Vendor Name</nz-form-label>
                <nz-form-control nzErrorTip="Please enter vendor name">
                  <input nz-input formControlName="name" placeholder="Enter vendor name" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Code</nz-form-label>
                <nz-form-control nzErrorTip="Please enter code">
                  <input nz-input formControlName="code" placeholder="e.g., VEN-0001" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Email</nz-form-label>
                <nz-form-control nzErrorTip="Please enter valid email">
                  <input nz-input formControlName="email" type="email" placeholder="vendor@example.com" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Phone</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="phone" placeholder="+91 1234567890" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <nz-form-item>
            <nz-form-label>GST Number</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="gstNumber" placeholder="GST Number" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Address</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="address" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Credit Limit (₹)</nz-form-label>
            <nz-form-control>
              <nz-input-number formControlName="creditLimit" [nzMin]="0" style="width: 100%;" placeholder="0"></nz-input-number>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Status</nz-form-label>
            <nz-form-control>
              <nz-switch formControlName="isActive"></nz-switch>
              <span style="margin-left: 12px;">{{ form.get('isActive')?.value ? 'Active' : 'Inactive' }}</span>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>

    <nz-modal [(nzVisible)]="statementVisible" [nzTitle]="statementTitle" (nzOnCancel)="statementVisible=false"
              [nzFooter]="statementFooter" nzWidth="1000px">
      <ng-container *nzModalContent>
        <div *ngIf="statementLoading" class="statement-loading">Loading statement...</div>
        <ng-container *ngIf="!statementLoading && statement">
          <div nz-row [nzGutter]="16" class="statement-summary">
            <div nz-col [nzSpan]="6">
              <nz-statistic nzTitle="Total Purchases" [nzValue]="statement.summary?.totalPurchases || 0" nzPrefix="INR "></nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic nzTitle="Invoiced" [nzValue]="statement.summary?.totalInvoiced || 0" nzPrefix="INR "></nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic nzTitle="Paid" [nzValue]="statement.summary?.totalPaid || 0" nzPrefix="INR "></nz-statistic>
            </div>
            <div nz-col [nzSpan]="6">
              <nz-statistic nzTitle="Outstanding" [nzValue]="statement.summary?.totalOutstanding || 0" nzPrefix="INR "
                [nzValueStyle]="{ color: '#b42318' }"></nz-statistic>
            </div>
          </div>

          <nz-tabset>
            <nz-tab nzTitle="Ledger">
              <nz-table [nzData]="statementLedger" nzSize="small" [nzShowPagination]="false">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Document</th><th nzAlign="right">Debit</th><th nzAlign="right">Credit</th><th nzAlign="right">Balance</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of statementLedger">
                    <td>{{ row.date | date:'dd MMM yyyy' }}</td>
                    <td><nz-tag [nzColor]="row.type === 'Payment' ? 'green' : 'orange'">{{ row.type }}</nz-tag></td>
                    <td>{{ row.number }}</td>
                    <td nzAlign="right">{{ row.debit ? formatCurrency(row.debit) : '-' }}</td>
                    <td nzAlign="right">{{ row.credit ? formatCurrency(row.credit) : '-' }}</td>
                    <td nzAlign="right"><strong>{{ formatCurrency(row.balance) }}</strong></td>
                  </tr>
                </tbody>
              </nz-table>
            </nz-tab>
            <nz-tab nzTitle="Invoices">
              <nz-table [nzData]="statement.invoices || []" nzSize="small" [nzShowPagination]="false">
                <thead><tr><th>Invoice</th><th>Date</th><th>Due</th><th>Status</th><th nzAlign="right">Total</th><th nzAlign="right">Balance</th></tr></thead>
                <tbody>
                  <tr *ngFor="let inv of statement.invoices">
                    <td>{{ inv.invoiceNumber }}</td><td>{{ inv.invoiceDate | date:'dd MMM yyyy' }}</td><td>{{ inv.dueDate | date:'dd MMM yyyy' }}</td>
                    <td><nz-tag>{{ inv.status }}</nz-tag></td><td nzAlign="right">{{ formatCurrency(inv.total) }}</td><td nzAlign="right">{{ formatCurrency(inv.balanceAmount) }}</td>
                  </tr>
                </tbody>
              </nz-table>
            </nz-tab>
            <nz-tab nzTitle="Payments">
              <nz-table [nzData]="statement.payments || []" nzSize="small" [nzShowPagination]="false">
                <thead><tr><th>Payment</th><th>Date</th><th>Method</th><th>Reference</th><th nzAlign="right">Amount</th></tr></thead>
                <tbody>
                  <tr *ngFor="let pay of statement.payments">
                    <td>{{ pay.paymentNumber }}</td><td>{{ pay.paymentDate | date:'dd MMM yyyy' }}</td><td>{{ pay.method }}</td><td>{{ pay.reference || '-' }}</td>
                    <td nzAlign="right">{{ formatCurrency(pay.amount) }}</td>
                  </tr>
                </tbody>
              </nz-table>
            </nz-tab>
          </nz-tabset>
        </ng-container>
      </ng-container>
    </nz-modal>
    <ng-template #statementFooter>
      <button nz-button (click)="exportStatementCsv()" [disabled]="!statement">
        <span nz-icon nzType="download"></span>
        Export CSV
      </button>
      <button nz-button nzType="primary" (click)="statementVisible=false">Close</button>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .header-left p { margin: 4px 0 0; color: rgba(0, 0, 0, 0.45); }
    .header-right { display: flex; align-items: center; }
    .statement-summary { margin-bottom: 16px; }
    .statement-loading { padding: 32px; text-align: center; color: rgba(0,0,0,.45); }
  `]
})
export class VendorListComponent implements OnInit {
  vendors: Vendor[] = [];
  loading = false;
  total = 0;
  pageSize = 20;
  pageIndex = 1;
  searchText = '';
  modalVisible = false;
  modalTitle = '';
  isEditMode = false;
  form!: FormGroup;
  currentId: string | null = null;
  statementVisible = false;
  statementLoading = false;
  statement: any = null;
  statementTitle = 'Vendor Statement';
  private searchSubject = new Subject<string>();

  constructor(private fb: FormBuilder, private service: MasterDataService,
              private modal: NzModalService, private message: NzMessageService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      email: ['', [Validators.email]],
      phone: [''],
      gstNumber: [''],
      address: [''],
      creditLimit: [0],
      isActive: [true]
    });
    this.searchSubject.pipe(debounceTime(500)).subscribe(search => {
      this.searchText = search;
      this.pageIndex = 1;
      this.loadData();
    });
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.service.getVendors({ page: this.pageIndex, limit: this.pageSize, search: this.searchText || undefined }).subscribe({
      next: (res) => { this.vendors = res.data; this.total = res.meta.total; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(value: string): void { this.searchSubject.next(value); }
  onPageChange(page: number): void { this.pageIndex = page; this.loadData(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.pageIndex = 1; this.loadData(); }

  openCreateModal(): void {
    this.isEditMode = false;
    this.modalTitle = 'Create Vendor';
    this.currentId = null;
    this.form.reset({ isActive: true, creditLimit: 0 });
    this.modalVisible = true;
  }

  openEditModal(item: Vendor): void {
    this.isEditMode = true;
    this.modalTitle = 'Edit Vendor';
    this.currentId = item.id;
    this.form.patchValue(item);
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.form.valid) {
      const req = this.isEditMode ? this.service.updateVendor(this.currentId!, this.form.value) : this.service.createVendor(this.form.value);
      req.subscribe({
        next: () => {
          this.message.success(this.isEditMode ? 'Updated successfully' : 'Created successfully');
          this.modalVisible = false;
          this.loadData();
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) { control.markAsDirty(); control.updateValueAndValidity({ onlySelf: true }); }
      });
    }
  }

  handleModalCancel(): void { this.modalVisible = false; }

  confirmDelete(item: Vendor): void {
    this.modal.confirm({
      nzTitle: 'Delete Vendor',
      nzContent: `Are you sure you want to delete "${item.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.service.deleteVendor(item.id).subscribe({
        next: () => { this.message.success('Deleted successfully'); this.loadData(); }
      })
    });
  }

  get statementLedger(): any[] {
    const entries = [
      ...(this.statement?.invoices || []).map((inv: any) => ({
        date: inv.invoiceDate,
        type: 'Invoice',
        number: inv.invoiceNumber,
        debit: Number(inv.total || 0),
        credit: 0,
      })),
      ...(this.statement?.payments || []).map((pay: any) => ({
        date: pay.paymentDate,
        type: 'Payment',
        number: pay.paymentNumber,
        debit: 0,
        credit: Number(pay.amount || 0),
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    return entries.map(row => {
      balance += row.debit - row.credit;
      return { ...row, balance };
    });
  }

  openStatement(item: Vendor): void {
    this.statementVisible = true;
    this.statementLoading = true;
    this.statementTitle = `${item.name} Statement`;
    this.service.getVendorStatement(item.id).subscribe({
      next: (res: any) => {
        this.statement = res.data ?? res;
        this.statementLoading = false;
      },
      error: () => {
        this.statementLoading = false;
        this.message.error('Unable to load vendor statement');
      }
    });
  }

  formatCurrency(value: number): string {
    return `INR ${Number(value || 0).toLocaleString('en-IN')}`;
  }

  exportStatementCsv(): void {
    if (!this.statement) return;
    const rows = [
      ['Vendor Statement', this.statement.vendor?.name || ''],
      ['Code', this.statement.vendor?.code || ''],
      [],
      ['Summary'],
      ['Total Purchases', 'Total Invoiced', 'Total Paid', 'Outstanding'],
      [
        this.statement.summary?.totalPurchases || 0,
        this.statement.summary?.totalInvoiced || 0,
        this.statement.summary?.totalPaid || 0,
        this.statement.summary?.totalOutstanding || 0,
      ],
      [],
      ['Ledger'],
      ['Date', 'Type', 'Document', 'Debit', 'Credit', 'Balance'],
      ...this.statementLedger.map(row => [
        new Date(row.date).toISOString().split('T')[0],
        row.type,
        row.number,
        row.debit || 0,
        row.credit || 0,
        row.balance || 0,
      ]),
      [],
      ['Invoices'],
      ['Invoice', 'Date', 'Due Date', 'Status', 'Total', 'Paid', 'Balance'],
      ...(this.statement.invoices || []).map((inv: any) => [
        inv.invoiceNumber,
        new Date(inv.invoiceDate).toISOString().split('T')[0],
        new Date(inv.dueDate).toISOString().split('T')[0],
        inv.status,
        inv.total || 0,
        inv.paidAmount || 0,
        inv.balanceAmount || 0,
      ]),
      [],
      ['Payments'],
      ['Payment', 'Date', 'Method', 'Reference', 'Amount'],
      ...(this.statement.payments || []).map((pay: any) => [
        pay.paymentNumber,
        new Date(pay.paymentDate).toISOString().split('T')[0],
        pay.method,
        pay.reference || '',
        pay.amount || 0,
      ]),
    ];

    this.downloadRows(rows, `vendor-statement-${this.statement.vendor?.code || 'export'}.csv`);
  }

  private downloadRows(rows: unknown[][], fileName: string): void {
    const csv = rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: unknown): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }
}

