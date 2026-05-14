import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { ProductApiService, Category } from '../services/product-api.service';

@Component({
  selector: 'app-category-list',
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
    NzSelectModule,
    NzSwitchModule,
    NzIconModule,
    NzTagModule,
    NzSpaceModule
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  allCategories: Category[] = []; // For parent selection
  loading = false;
  modalVisible = false;
  modalTitle = '';
  isEditMode = false;
  categoryForm!: FormGroup;
  currentCategoryId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productApi: ProductApiService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      parentId: [null],
      isActive: [true]
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.productApi.getCategories().subscribe({
      next: (response: any) => {
        // Handle nested response structure: { data: { data: [], meta: {} } }
        const dataArray = response?.data?.data || response?.data;
        const categories = Array.isArray(dataArray) ? dataArray : [];
        this.allCategories = categories;
        this.categories = this.buildCategoryTree(categories);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create map
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.modalTitle = 'Create Category';
    this.currentCategoryId = null;
    this.categoryForm.reset({ isActive: true });
    this.modalVisible = true;
  }

  openEditModal(category: Category): void {
    this.isEditMode = true;
    this.modalTitle = 'Edit Category';
    this.currentCategoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive
    });
    this.modalVisible = true;
  }

  handleModalOk(): void {
    if (this.categoryForm.valid) {
      const formData = this.categoryForm.value;

      // Prepare payload based on operation
      let payload: any;
      if (this.isEditMode) {
        // For update, send all fields
        payload = formData;
      } else {
        // For create, only send name, description, and parentId
        // Backend auto-generates code and defaults isActive to true
        payload = {
          name: formData.name,
          description: formData.description,
          parentId: formData.parentId
        };
      }

      const request = this.isEditMode
        ? this.productApi.updateCategory(this.currentCategoryId!, payload)
        : this.productApi.createCategory(payload);

      request.subscribe({
        next: () => {
          this.message.success(
            this.isEditMode ? 'Category updated successfully' : 'Category created successfully'
          );
          this.modalVisible = false;
          this.loadCategories();
        }
      });
    } else {
      Object.values(this.categoryForm.controls).forEach(control => {
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

  confirmDelete(category: Category): void {
    this.modal.confirm({
      nzTitle: 'Delete Category',
      nzContent: `Are you sure you want to delete "${category.name}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => this.deleteCategory(category.id)
    });
  }

  deleteCategory(id: string): void {
    this.productApi.deleteCategory(id).subscribe({
      next: () => {
        this.message.success('Category deleted successfully');
        this.loadCategories();
      }
    });
  }

  getAvailableParents(): Category[] {
    if (!this.isEditMode || !this.currentCategoryId) {
      return this.allCategories;
    }
    // Exclude current category and its descendants
    return this.allCategories.filter(cat => cat.id !== this.currentCategoryId);
  }
}

