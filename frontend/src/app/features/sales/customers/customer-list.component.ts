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
import { MasterDataService } from '../../../core/services/master-data.service';
import { Customer } from '../../../core/models/master-data.model';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzModalModule, NzFormModule, NzInputModule, NzInputNumberModule, NzSwitchModule,
    NzIconModule, NzTagModule, NzSpaceModule, NzGridModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Customers</h2>
          <p>Manage customer database</p>
        </div>
        <div class="header-right">
          <nz-input-group nzSearch [nzAddOnAfter]="suffixIconButton" style="width: 300px; margin-right: 16px;">
            <input type="text" nz-input placeholder="Search customers..." [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" />
          </nz-input-group>
          <ng-template #suffixIconButton>
            <button nz-button nzType="primary" nzSearch><span nz-icon nzType="search"></span></button>
          </ng-template>
          <button nz-button nzType="primary" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span>
            Add Customer
          </button>
        </div>
      </div>

      <nz-table #table [nzData]="customers" [nzLoading]="loading" [nzTotal]="total"
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
            <th nzAlign="center" nzWidth="120px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of table.data">
            <td><nz-tag nzColor="green">{{ item.code }}</nz-tag></td>
            <td><strong>{{ item.name }}</strong></td>
            <td>{{ item.phone || item.email || '-' }}</td>
            <td>{{ item.gstNumber || '-' }}</td>
            <td nzAlign="right">{{ item.creditLimit ? '₹' + item.creditLimit.toLocaleString() : '-' }}</td>
            <td nzAlign="center">
              <nz-tag [nzColor]="item.isActive ? 'green' : 'red'">
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </nz-tag>
            </td>
            <td nzAlign="center">
              <nz-space>
                <button *nzSpaceItem nz-button nzType="default" nzSize="small" (click)="openEditModal(item)">
                  <span nz-icon nzType="edit"></span>
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
                <nz-form-label nzRequired>Customer Name</nz-form-label>
                <nz-form-control nzErrorTip="Please enter customer name">
                  <input nz-input formControlName="name" placeholder="Enter customer name" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Code</nz-form-label>
                <nz-form-control nzErrorTip="Please enter code">
                  <input nz-input formControlName="code" placeholder="e.g., CUS-0001" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Email</nz-form-label>
                <nz-form-control nzErrorTip="Please enter valid email">
                  <input nz-input formControlName="email" type="email" placeholder="customer@example.com" />
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
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label>Credit Limit (₹)</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="creditLimit" [nzMin]="0" style="width: 100%;" placeholder="0"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label>Credit Days</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="creditDays" [nzMin]="0" style="width: 100%;" placeholder="0"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="8">
              <nz-form-item>
                <nz-form-label>Opening Balance (₹)</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="openingBalance" style="width: 100%;" placeholder="0"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
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
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-left h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .header-left p { margin: 4px 0 0; color: rgba(0, 0, 0, 0.45); }
    .header-right { display: flex; align-items: center; }
  `]
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
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
      creditDays: [0],
      openingBalance: [0],
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
    this.service.getCustomers({ page: this.pageIndex, limit: this.pageSize, search: this.searchText || undefined }).subscribe({
      next: (res) => { this.customers = res.data; this.total = res.meta.total; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(value: string): void { this.searchSubject.next(value); }
  onPageChange(page: number): void { this.pageIndex = page; this.loadData(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.pageIndex = 1; this.loadData(); }

  openCreateModal(): void {
    this.isEditMode = false;
    this.modalTitle = 'Create Customer';
    this.currentId = null;
    this.form.reset({ isActive: true, creditLimit: 0, creditDays: 0, openingBalance: 0 });
    this.modalVisible = true;
  }

  openEditModal(item: Customer): void {
    this.isEditMode = true;
    this.modalTitle = 'Edit Customer';
    this.currentId = item.id;
    this.form.patchValue(item);
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.form.valid) {
      const req = this.isEditMode ? this.service.updateCustomer(this.currentId!, this.form.value) : this.service.createCustomer(this.form.value);
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

  confirmDelete(item: Customer): void {
    this.modal.confirm({
      nzTitle: 'Delete Customer',
      nzContent: `Are you sure you want to delete "${item.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.service.deleteCustomer(item.id).subscribe({
        next: () => { this.message.success('Deleted successfully'); this.loadData(); }
      })
    });
  }
}

