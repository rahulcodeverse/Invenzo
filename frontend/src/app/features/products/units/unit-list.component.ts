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
import { ProductApiService, Unit } from '../services/product-api.service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    NzIconModule,
    NzTagModule,
    NzSpaceModule
  ],
  templateUrl: './unit-list.component.html',
  styleUrls: ['./unit-list.component.scss']
})
export class UnitListComponent implements OnInit {
  units: Unit[] = [];
  loading = false;
  modalVisible = false;
  modalTitle = '';
  isEditMode = false;
  unitForm!: FormGroup;
  currentUnitId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productApi: ProductApiService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  initForm(): void {
    this.unitForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      symbol: ['', [Validators.required, Validators.maxLength(10)]],
      isActive: [true]
    });
  }

  loadUnits(): void {
    this.loading = true;
    this.productApi.getUnits().subscribe({
      next: (response: any) => {
        // Handle nested response structure: { data: { data: [], meta: {} } }
        const dataArray = response?.data?.data || response?.data;
        this.units = Array.isArray(dataArray) ? dataArray : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.modalTitle = 'Create Unit';
    this.currentUnitId = null;
    this.unitForm.reset({ isActive: true });
    this.modalVisible = true;
  }

  openEditModal(unit: Unit): void {
    this.isEditMode = true;
    this.modalTitle = 'Edit Unit';
    this.currentUnitId = unit.id;
    this.unitForm.patchValue({
      name: unit.name,
      symbol: unit.symbol,
      isActive: unit.isActive
    });
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.unitForm.valid) {
      const formData = this.unitForm.value;

      // Prepare payload based on mode
      let payload: any;
      if (this.isEditMode) {
        // Update: send all fields including isActive
        payload = formData;
      } else {
        // Create: only send name and symbol (isActive not allowed by backend)
        payload = {
          name: formData.name,
          symbol: formData.symbol
        };
      }

      const request = this.isEditMode
        ? this.productApi.updateUnit(this.currentUnitId!, payload)
        : this.productApi.createUnit(payload);

      request.subscribe({
        next: () => {
          this.message.success(
            this.isEditMode ? 'Unit updated successfully' : 'Unit created successfully'
          );
          this.modalVisible = false;
          this.loadUnits();
        },
        error: (error) => {
          const errorMsg = error?.error?.message || 'Operation failed';
          this.message.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
        }
      });
    } else {
      Object.values(this.unitForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Please fill in all required fields');
    }
  }

  handleModalCancel(): void {
    this.modalVisible = false;
  }

  confirmDelete(unit: Unit): void {
    this.modal.confirm({
      nzTitle: 'Delete Unit',
      nzContent: `Are you sure you want to delete "${unit.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.deleteUnit(unit.id)
    });
  }

  deleteUnit(id: string): void {
    this.productApi.deleteUnit(id).subscribe({
      next: () => {
        this.message.success('Unit deleted successfully');
        this.loadUnits();
      }
    });
  }
}

