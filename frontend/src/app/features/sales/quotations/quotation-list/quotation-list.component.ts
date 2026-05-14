import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzCardModule } from 'ng-zorro-antd/card';
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { Quotation, QuotationStatus } from '../../models/sales.model';
import { Customer } from '../../../../core/models/master-data.model';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-quotation-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, NzTableModule, NzButtonModule, NzInputModule,
    NzSelectModule, NzTagModule, NzModalModule, NzIconModule, NzSpaceModule, NzCardModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Quotations</h2>
          <p>Manage sales quotations</p>
        </div>
        <div class="header-right">
          <button nz-button nzType="primary" (click)="navigateToNew()">
            <span nz-icon nzType="plus"></span>
            New Quotation
          </button>
        </div>
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
            <nz-option nzLabel="Draft" nzValue="DRAFT"></nz-option>
            <nz-option nzLabel="Sent" nzValue="SENT"></nz-option>
            <nz-option nzLabel="Approved" nzValue="APPROVED"></nz-option>
            <nz-option nzLabel="Converted" nzValue="CONVERTED"></nz-option>
          </nz-select>

          <nz-select *nzSpaceItem nzShowSearch nzAllowClear nzPlaceHolder="Customer"
                     [(ngModel)]="selectedCustomer" (ngModelChange)="onFilterChange()" style="width: 200px;">
            <nz-option *ngFor="let customer of customers" [nzLabel]="customer.name" [nzValue]="customer.id"></nz-option>
          </nz-select>

          <button *nzSpaceItem nz-button (click)="resetFilters()">
            <span nz-icon nzType="redo"></span> Reset
          </button>
        </nz-space>
      </div>

      <nz-table #table [nzData]="quotations" [nzLoading]="loading" [nzTotal]="total"
                [nzPageSize]="pageSize" [nzPageIndex]="pageIndex" [nzFrontPagination]="false"
                (nzPageIndexChange)="onPageChange($event)" (nzPageSizeChange)="onPageSizeChange($event)"
                [nzShowSizeChanger]="true" [nzPageSizeOptions]="[10, 20, 50]">
        <thead>
          <tr>
            <th>Quote #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Valid Until</th>
            <th nzAlign="right">Amount</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="180px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of table.data">
            <td><nz-tag nzColor="blue">{{ item.quotationNumber }}</nz-tag></td>
            <td><strong>{{ item.customer?.name || '-' }}</strong></td>
            <td>{{ item.quotationDate | date:'dd/MM/yyyy' }}</td>
            <td>{{ item.validUntil | date:'dd/MM/yyyy' }}</td>
            <td nzAlign="right"><strong>₹{{ item.totalAmount.toLocaleString() }}</strong></td>
            <td nzAlign="center">
              <nz-tag [nzColor]="getStatusColor(item.status)">{{ item.status }}</nz-tag>
            </td>
            <td nzAlign="center">
              <nz-space>
                <button *nzSpaceItem nz-button nzSize="small" [routerLink]="['/sales/quotations', item.id, 'edit']">
                  <span nz-icon nzType="edit"></span>
                </button>
                <ng-container *ngIf="item.status === 'APPROVED'">
                  <button *nzSpaceItem nz-button nzSize="small" nzType="primary" (click)="convertToOrder(item)">
                    <span nz-icon nzType="swap"></span> Convert
                  </button>
                </ng-container>
                <button *nzSpaceItem nz-button nzSize="small" nzDanger (click)="confirmDelete(item)">
                  <span nz-icon nzType="delete"></span>
                </button>
              </nz-space>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .header-left p { margin: 4px 0 0; color: rgba(0, 0, 0, 0.45); }
    .filters-section { margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 4px; }
  `]
})
export class QuotationListComponent implements OnInit {
  quotations: Quotation[] = [];
  customers: Customer[] = [];
  loading = false;
  total = 0;
  pageSize = 20;
  pageIndex = 1;
  searchText = '';
  selectedStatus: string | null = null;
  selectedCustomer: string | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private salesService: SalesService,
    private masterDataService: MasterDataService,
    private router: Router,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => this.loadQuotations());
  }

  ngOnInit(): void {
    this.loadQuotations();
    this.loadCustomers();
  }

  loadQuotations(): void {
    this.loading = true;
    this.salesService.getQuotations({
      page: this.pageIndex,
      limit: this.pageSize,
      search: this.searchText || undefined,
      status: this.selectedStatus || undefined,
      customerId: this.selectedCustomer || undefined
    }).subscribe({
      next: (res) => { this.quotations = res.data; this.total = res.meta.total; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadCustomers(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: (res) => { this.customers = res.data; }
    });
  }

  onSearch(value: string): void { this.searchSubject.next(value); }
  onPageChange(page: number): void { this.pageIndex = page; this.loadQuotations(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.pageIndex = 1; this.loadQuotations(); }
  onFilterChange(): void { this.pageIndex = 1; this.loadQuotations(); }
  resetFilters(): void { this.searchText = ''; this.selectedStatus = null; this.selectedCustomer = null; this.loadQuotations(); }
  navigateToNew(): void { this.router.navigate(['/sales/quotations/new']); }

  getStatusColor(status: string): string {
    const colors: any = { DRAFT: 'default', SENT: 'blue', APPROVED: 'green', REJECTED: 'red', CONVERTED: 'purple' };
    return colors[status] || 'default';
  }

  convertToOrder(quotation: Quotation): void {
    this.modal.confirm({
      nzTitle: 'Convert to Sales Order',
      nzContent: `Convert quotation ${quotation.quotationNumber} to Sales Order?`,
      nzOnOk: () => this.salesService.convertQuotationToOrder(quotation.id).subscribe({
        next: (res) => {
          this.message.success('Converted to Sales Order successfully');
          this.router.navigate(['/sales/orders', res.data.id]);
        }
      })
    });
  }

  confirmDelete(item: Quotation): void {
    this.modal.confirm({
      nzTitle: 'Delete Quotation',
      nzContent: `Delete ${item.quotationNumber}?`,
      nzOkDanger: true,
      nzOnOk: () => this.salesService.deleteQuotation(item.id).subscribe({
        next: () => { this.message.success('Deleted'); this.loadQuotations(); }
      })
    });
  }
}

