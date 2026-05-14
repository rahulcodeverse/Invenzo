import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { MasterDataService } from '../../../core/services/master-data.service';
import { Warehouse } from '../../../core/models/master-data.model';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzModalModule, NzFormModule, NzInputModule, NzSwitchModule, NzIconModule,
    NzTagModule, NzSpaceModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Warehouses</h2>
          <p>Manage warehouse locations</p>
        </div>
        <div class="header-right">
          <button nz-button nzType="primary" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span>
            Add Warehouse
          </button>
        </div>
      </div>

      <nz-table #table [nzData]="warehouses" [nzLoading]="loading" [nzPageSize]="20" nzSize="middle">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Address</th>
            <th>Contact</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="120px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of table.data">
            <td><nz-tag nzColor="cyan">{{ item.code }}</nz-tag></td>
            <td><strong>{{ item.name }}</strong></td>
            <td>{{ item.address || '-' }}</td>
            <td>{{ item.phone || '-' }}</td>
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

    <nz-modal [(nzVisible)]="modalVisible" [nzTitle]="modalTitle" (nzOnCancel)="handleModalCancel()" (nzOnOk)="handleModalOk()" nzWidth="600px">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <nz-form-item>
            <nz-form-label nzRequired>Warehouse Name</nz-form-label>
            <nz-form-control nzErrorTip="Please enter warehouse name">
              <input nz-input formControlName="name" placeholder="Enter warehouse name" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label nzRequired>Code</nz-form-label>
            <nz-form-control nzErrorTip="Please enter code">
              <input nz-input formControlName="code" placeholder="e.g., WH-001" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Address</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="address" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
            </nz-form-control>
          </nz-form-item>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Phone</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="phone" placeholder="+91 1234567890" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label>Email</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="email" placeholder="warehouse@example.com" />
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
  `]
})
export class WarehouseListComponent implements OnInit {
  warehouses: Warehouse[] = [];
  loading = false;
  modalVisible = false;
  modalTitle = '';
  isEditMode = false;
  form!: FormGroup;
  currentId: string | null = null;

  constructor(private fb: FormBuilder, private service: MasterDataService, private modal: NzModalService, private message: NzMessageService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      isActive: [true]
    });
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.service.getWarehouses().subscribe({
      next: (response: any) => {
        // Handle nested response structure: response.data.data contains the array
        let data;
        if (response.data && response.data.data) {
          // Paginated response: { success, data: { data: [...], meta: {...} } }
          data = response.data.data;
        } else if (response.data) {
          // Simple response: { success, data: [...] }
          data = response.data;
        } else {
          // Direct array: [...]
          data = response;
        }

        this.warehouses = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.warehouses = [];
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.modalTitle = 'Create Warehouse';
    this.currentId = null;
    this.form.reset({ isActive: true });
    this.modalVisible = true;
  }

  openEditModal(item: Warehouse): void {
    this.isEditMode = true;
    this.modalTitle = 'Edit Warehouse';
    this.currentId = item.id;
    this.form.patchValue(item);
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.form.valid) {
      const req = this.isEditMode ? this.service.updateWarehouse(this.currentId!, this.form.value) : this.service.createWarehouse(this.form.value);
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

  confirmDelete(item: Warehouse): void {
    this.modal.confirm({
      nzTitle: 'Delete Warehouse',
      nzContent: `Are you sure you want to delete "${item.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.service.deleteWarehouse(item.id).subscribe({
        next: () => { this.message.success('Deleted successfully'); this.loadData(); }
      })
    });
  }
}

