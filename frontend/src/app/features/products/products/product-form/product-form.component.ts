import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProductApiService, Category, Brand, Unit } from '../../services/product-api.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzSwitchModule,
    NzInputNumberModule,
    NzSpinModule,
    NzGridModule,
    NzIconModule,
    NzCheckboxModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  saving = false;

  categories: Category[] = [];
  brands: Brand[] = [];
  units: Unit[] = [];

  constructor(
    private fb: FormBuilder,
    private productApi: ProductApiService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {
    // Initialize form immediately to avoid template binding errors
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sku: [''],  // Only used in edit mode (disabled in template for create)
      barcode: [''],
      description: [''],
      categoryId: [null, [Validators.required]],  // Required by backend
      brandId: [null],
      unitId: [null, [Validators.required]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      mrp: [0, [Validators.min(0)]],
      taxRate: [0, [Validators.min(0), Validators.max(100)]],
      minStockLevel: [0, [Validators.min(0)]],
      maxStockLevel: [0, [Validators.min(0)]],
      reorderLevel: [0, [Validators.min(0)]],
      trackExpiry: [false],
      hasVariants: [false],
      hasBatch: [false],
      hasSerial: [false]
      // Note: isActive is NOT included - backend auto-defaults it to true on create
      // For updates, if needed, it would be added separately
    });
  }

  ngOnInit(): void {
    this.loadMasterData();

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }


  loadMasterData(): void {
    this.productApi.getCategories().subscribe({
      next: (response: any) => {
        console.log('Categories response:', response);
        // Handle both response formats: { data: { data: [], meta: {} } } or { data: [] }
        const dataArray = response?.data?.data || response?.data;
        this.categories = Array.isArray(dataArray) ? dataArray : [];
        console.log('Final categories:', this.categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
      }
    });

    this.productApi.getBrands().subscribe({
      next: (response: any) => {
        console.log('Brands response:', response);
        // Handle both response formats: { data: { data: [], meta: {} } } or { data: [] }
        const dataArray = response?.data?.data || response?.data;
        this.brands = Array.isArray(dataArray) ? dataArray : [];
        console.log('Final brands:', this.brands);
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.brands = [];
      }
    });

    this.productApi.getUnits().subscribe({
      next: (response: any) => {
        console.log('Units response:', response);
        // Handle both response formats: { data: { data: [], meta: {} } } or { data: [] }
        const dataArray = response?.data?.data || response?.data;
        this.units = Array.isArray(dataArray) ? dataArray : [];
        console.log('Final units:', this.units);
      },
      error: (error) => {
        console.error('Error loading units:', error);
        this.units = [];
      }
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productApi.getProductById(id).subscribe({
      next: (response) => {
        const product = response.data;
        this.productForm.patchValue({
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || '',
          description: product.description,
          categoryId: product.categoryId,
          brandId: product.brandId,
          unitId: product.unitId,
          costPrice: product.costPrice || 0,
          sellingPrice: product.sellingPrice || product.unitPrice || 0,
          mrp: product.mrp || 0,
          taxRate: product.taxRate || 0,
          minStockLevel: product.minStockLevel || product.minStock || 0,
          maxStockLevel: product.maxStockLevel || product.maxStock || 0,
          reorderLevel: product.reorderLevel || product.reorderPoint || 0,
          trackExpiry: product.trackExpiry || false,
          hasVariants: product.hasVariants || false,
          hasBatch: product.hasBatch || false,
          hasSerial: product.hasSerial || false
          // Note: isActive is not in form anymore - backend handles it
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message.error('Failed to load product');
        this.router.navigate(['/products']);
      }
    });
  }


  onSubmit(): void {
    if (this.productForm.valid) {
      this.saving = true;
      const formData = this.productForm.value;

      // Prepare payload based on operation
      let payload: any;
      if (this.isEditMode) {
        // Update: send all fields including sku (but not isActive as form doesn't have it)
        payload = { ...formData };
      } else {
        // Create: exclude sku (backend auto-generates it)
        // Also clean up optional fields
        const { sku, ...createData } = formData;
        payload = {};

        // Required fields
        payload.name = createData.name;
        payload.categoryId = createData.categoryId;
        payload.unitId = createData.unitId;
        payload.costPrice = createData.costPrice;
        payload.sellingPrice = createData.sellingPrice;

        // Optional fields - only include if they have meaningful values
        if (createData.description && createData.description.trim()) {
          payload.description = createData.description.trim();
        }
        if (createData.brandId) {
          payload.brandId = createData.brandId;
        }
        if (createData.barcode && createData.barcode.trim()) {
          payload.barcode = createData.barcode.trim();
        }
        if (createData.mrp && createData.mrp > 0) {
          payload.mrp = createData.mrp;
        }
        if (createData.taxRate && createData.taxRate > 0) {
          payload.taxRate = createData.taxRate;
        }
        if (createData.minStockLevel && createData.minStockLevel > 0) {
          payload.minStockLevel = createData.minStockLevel;
        }
        if (createData.maxStockLevel && createData.maxStockLevel > 0) {
          payload.maxStockLevel = createData.maxStockLevel;
        }
        if (createData.reorderLevel && createData.reorderLevel > 0) {
          payload.reorderLevel = createData.reorderLevel;
        }

        // Boolean flags - include if true
        if (createData.hasVariants) {
          payload.hasVariants = createData.hasVariants;
        }
        if (createData.hasBatch) {
          payload.hasBatch = createData.hasBatch;
        }
        if (createData.hasSerial) {
          payload.hasSerial = createData.hasSerial;
        }
        if (createData.trackExpiry) {
          payload.trackExpiry = createData.trackExpiry;
        }
      }

      console.log('Submitting product payload:', payload);

      const request = this.isEditMode
        ? this.productApi.updateProduct(this.productId!, payload)
        : this.productApi.createProduct(payload);

      request.subscribe({
        next: () => {
          this.message.success(
            this.isEditMode ? 'Product updated successfully' : 'Product created successfully'
          );
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Save error:', error);
          const errorMsg = error?.error?.message || 'Failed to save product';
          this.message.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
          this.saving = false;
        },
        complete: () => {
          this.saving = false;
        }
      });
    } else {
      // Mark all controls as dirty to show validation errors
      Object.values(this.productForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });

      // Log which fields are invalid for debugging
      const invalidFields = Object.keys(this.productForm.controls).filter(
        key => this.productForm.get(key)?.invalid
      );
      console.log('Invalid fields:', invalidFields);

      this.message.warning('Please fill in all required fields');
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}

