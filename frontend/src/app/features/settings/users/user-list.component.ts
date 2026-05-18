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
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-user-list',
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
    NzSpaceModule,
    NzPopconfirmModule,
    NzEmptyModule,
    NzToolTipModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  isModalVisible = false;
  isEditMode = false;
  userForm!: FormGroup;
  currentUserId: string | null = null;

  roles = [
    { label: 'Owner', value: 'OWNER' },
    { label: 'Manager', value: 'MANAGER' },
    { label: 'Staff', value: 'STAFF' },
    { label: 'Accountant', value: 'ACCOUNTANT' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: ['STAFF', Validators.required],
      isActive: [true]
    });
  }

  loadUsers(): void {
    this.loading = true;

    this.http.get<any>(`${environment.apiUrl}/users`).subscribe({
      next: (response) => {
        let data;
        if (response.data && response.data.data) {
          data = response.data.data;
        } else if (response.data) {
          data = response.data;
        } else {
          data = response;
        }

        this.users = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (error) => {
        this.message.error('Failed to load users: ' + (error.error?.message || error.message));
        this.users = [];
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentUserId = null;
    this.userForm.reset({ role: 'STAFF', isActive: true });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalVisible = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.currentUserId = user.id;
    this.userForm.patchValue({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.userForm.reset();
  }

  handleSubmit(): void {
    if (this.userForm.valid) {
      const formData = { ...this.userForm.value };

      if (this.isEditMode && !formData.password) {
        delete formData.password;
      }

      if (!this.isEditMode) {
        delete formData.isActive;
      }

      const request = this.isEditMode
        ? this.http.patch(`${environment.apiUrl}/users/${this.currentUserId}`, formData)
        : this.http.post(`${environment.apiUrl}/users`, formData);

      request.subscribe({
        next: () => {
          this.message.success(
            this.isEditMode ? 'User updated successfully' : 'User created successfully'
          );
          this.isModalVisible = false;
          this.userForm.reset();
          this.loadUsers();
        },
        error: (error) => {
          this.message.error(error.error?.message || 'Failed to save user');
        }
      });
    } else {
      Object.values(this.userForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    this.http.patch(`${environment.apiUrl}/users/${user.id}`, {
      isActive: newStatus
    }).subscribe({
      next: () => {
        user.isActive = newStatus;
        this.message.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      },
      error: () => {
        this.message.error('Failed to update user status');
      }
    });
  }

  deleteUser(userId: string): void {
    this.http.delete(`${environment.apiUrl}/users/${userId}`).subscribe({
      next: () => {
        this.message.success('User deleted successfully');
        this.loadUsers();
      },
      error: () => {
        this.message.error('Failed to delete user');
      }
    });
  }

  getRoleColor(role: string): string {
    const colors: any = {
      OWNER: 'red',
      MANAGER: 'gold',
      STAFF: 'gold',
      ACCOUNTANT: 'orange'
    };
    return colors[role] || 'default';
  }
}
