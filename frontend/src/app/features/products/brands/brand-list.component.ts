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
import { ProductApiService, Brand } from '../services/product-api.service';

@Component({
  selector: 'app-brand-list',
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
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.scss']
})
export class BrandListComponent implements OnInit {
  brands: Brand[] = [];
  loading = false;
  modalVisible = false;
  modalTitle = '';
  isEditMode = false;
  brandForm!: FormGroup;
  currentBrandId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productApi: ProductApiService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  initForm(): void {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      logo: [''],
      isActive: [true]
    });
  }

  loadBrands(): void {
    this.loading = true;
    this.productApi.getBrands().subscribe({
      next: (response: any) => {
        // Handle nested response structure: { data: { data: [], meta: {} } }
        const dataArray = response?.data?.data || response?.data;
        this.brands = Array.isArray(dataArray) ? dataArray : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.modalTitle = 'Create Brand';
    this.currentBrandId = null;
    this.brandForm.reset({ isActive: true });
    this.modalVisible = true;
  }

  openEditModal(brand: Brand): void {
    this.isEditMode = true;
    this.modalTitle = 'Edit Brand';
    this.currentBrandId = brand.id;
    this.brandForm.patchValue({
      name: brand.name,
      description: brand.description,
      logo: brand.logo,
      isActive: brand.isActive
    });
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.brandForm.valid) {
      const formData = this.brandForm.value;

      // Prepare payload based on operation
      let payload: any;
      if (this.isEditMode) {
        // For update, send all fields
        payload = formData;
      } else {
        // For create, only send name, description, and logo
        // Backend defaults isActive to true
        payload = {
          name: formData.name,
          description: formData.description,
          logo: formData.logo
        };
      }

      const request = this.isEditMode
        ? this.productApi.updateBrand(this.currentBrandId!, payload)
        : this.productApi.createBrand(payload);

      request.subscribe({
        next: () => {
          this.message.success(
            this.isEditMode ? 'Brand updated successfully' : 'Brand created successfully'
          );
          this.modalVisible = false;
          this.loadBrands();
        }
      });
    } else {
      Object.values(this.brandForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleModalCancel(): void {
    this.modalVisible = false;
  }

  confirmDelete(brand: Brand): void {
    this.modal.confirm({
      nzTitle: 'Delete Brand',
      nzContent: `Are you sure you want to delete "${brand.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.deleteBrand(brand.id)
    });
  }

  deleteBrand(id: string): void {
    this.productApi.deleteBrand(id).subscribe({
      next: () => {
        this.message.success('Brand deleted successfully');
        this.loadBrands();
      }
    });
  }
}

