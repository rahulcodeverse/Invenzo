import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface CompanySettings {
  id?: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId?: string;
  currency: string;
  logo?: string;
}

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzDividerModule,
    NzUploadModule,
    NzSelectModule
  ],
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.scss']
})
export class CompanySettingsComponent implements OnInit {
  companyForm!: FormGroup;
  loading = false;
  saving = false;
  logoUrl?: string;
  uploadedFile?: NzUploadFile;

  currencies = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'INR - Indian Rupee', value: 'INR' },
    { label: 'JPY - Japanese Yen', value: 'JPY' },
    { label: 'CNY - Chinese Yuan', value: 'CNY' }
  ];

  countries = [
    'United States',
    'United Kingdom',
    'India',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'China',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCompanySettings();
  }

  initForm(): void {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      website: [''],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      postalCode: ['', Validators.required],
      taxId: [''],
      currency: ['USD', Validators.required]
    });
  }

  loadCompanySettings(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/settings/company`).subscribe({
      next: (response) => {
        const settings = response.data || response;
        if (settings) {
          this.companyForm.patchValue(settings);
          this.logoUrl = settings.logo;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading company settings:', error);
        if (error.status !== 404) {
          this.message.warning('Company settings not found. Please fill in the details.');
        }
        this.loading = false;
      }
    });
  }

  saveSettings(): void {
    if (this.companyForm.valid) {
      this.saving = true;
      const formData = {
        ...this.companyForm.value,
        logo: this.logoUrl
      };

      this.http.post(`${environment.apiUrl}/settings/company`, formData).subscribe({
        next: () => {
          this.message.success('Company settings saved successfully');
          this.saving = false;
        },
        error: (error) => {
          console.error('Error saving settings:', error);
          this.message.error('Failed to save company settings');
          this.saving = false;
        }
      });
    } else {
      Object.values(this.companyForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Please fill in all required fields');
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      this.message.error('You can only upload image files!');
      return false;
    }
    const isLt2M = (file.size || 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.message.error('Image must be smaller than 2MB!');
      return false;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoUrl = e.target.result;
    };
    reader.readAsDataURL(file as any);

    return false; // Prevent auto upload
  };

  removeLogo(): void {
    this.logoUrl = undefined;
  }
}
