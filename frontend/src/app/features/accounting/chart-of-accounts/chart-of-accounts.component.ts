import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { AccountingService } from '../services/accounting.service';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, NzCardModule, NzTableModule, NzTreeModule,
    NzButtonModule, NzIconModule, NzTagModule, NzModalModule, NzFormModule, NzInputModule,
    NzSelectModule, NzMessageModule, NzTabsModule, NzGridModule, NzAlertModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Chart of Accounts</h2>
          <p>Manage account groups and ledger accounts</p>
        </div>
        <div>
          <button nz-button (click)="initialize()" [nzLoading]="initializing" style="margin-right:8px">
            <span nz-icon nzType="setting"></span> Initialize Defaults
          </button>
          <button nz-button nzType="primary" (click)="openAccountModal()">
            <span nz-icon nzType="plus"></span> New Account
          </button>
        </div>
      </div>

      <nz-alert *ngIf="accounts.length === 0 && !loading"
        nzType="info"
        nzMessage="No accounts found"
        nzDescription="Click 'Initialize Defaults' to set up the default chart of accounts."
        nzShowIcon style="margin-bottom:16px">
      </nz-alert>

      <nz-tabset>
        <nz-tab nzTitle="Accounts">
          <nz-table #table [nzData]="accounts" [nzLoading]="loading" nzSize="middle">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Group</th>
                <th nzAlign="right">Balance</th>
                <th nzAlign="center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let acc of table.data">
                <td><nz-tag nzColor="gold">{{ acc.code }}</nz-tag></td>
                <td><strong>{{ acc.name }}</strong></td>
                <td><nz-tag [nzColor]="getTypeColor(acc.type)">{{ acc.type }}</nz-tag></td>
                <td>{{ acc.group?.name || '-' }}</td>
                <td nzAlign="right" [style.color]="Number(acc.currentBalance) >= 0 ? '#9a4f12' : '#ff4d4f'">
                  {{ acc.currentBalance | number:'1.2-2' }}
                </td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="acc.isActive ? 'gold' : 'red'">{{ acc.isActive ? 'Active' : 'Inactive' }}</nz-tag>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>
        <nz-tab nzTitle="Account Groups">
          <nz-table #gtable [nzData]="groups" [nzLoading]="loading" nzSize="middle">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th nzAlign="center">Accounts</th>
                <th nzAlign="center">System</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of gtable.data">
                <td><nz-tag>{{ g.code }}</nz-tag></td>
                <td><strong>{{ g.name }}</strong></td>
                <td><nz-tag [nzColor]="getTypeColor(g.type)">{{ g.type }}</nz-tag></td>
                <td>{{ g.parent?.name || '-' }}</td>
                <td nzAlign="center">{{ g._count?.accounts ?? 0 }}</td>
                <td nzAlign="center">
                  <span nz-icon [nzType]="g.isSystem ? 'check-circle' : 'minus'" [style.color]="g.isSystem ? '#9a4f12' : '#ccc'"></span>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>
      </nz-tabset>
    </nz-card>

    <nz-modal [(nzVisible)]="accountModal" nzTitle="New Ledger Account"
      (nzOnCancel)="accountModal=false" (nzOnOk)="submitAccount()" [nzOkLoading]="saving">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="accountForm" nzLayout="vertical">
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Account Name</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="name" placeholder="e.g. Cash in Hand" />
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Account Code</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="code" placeholder="e.g. 1001" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Type</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="type">
                    <nz-option nzValue="ASSET" nzLabel="Asset"></nz-option>
                    <nz-option nzValue="LIABILITY" nzLabel="Liability"></nz-option>
                    <nz-option nzValue="EQUITY" nzLabel="Equity"></nz-option>
                    <nz-option nzValue="INCOME" nzLabel="Income"></nz-option>
                    <nz-option nzValue="EXPENSE" nzLabel="Expense"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Group</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="groupId" nzShowSearch nzPlaceHolder="Select group">
                    <nz-option *ngFor="let g of groups" [nzLabel]="g.name" [nzValue]="g.id"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <nz-form-item>
            <nz-form-label>Description</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="description" [nzAutosize]="{minRows:2,maxRows:3}"></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
  `]
})
export class ChartOfAccountsComponent implements OnInit {
  accounts: any[] = [];
  groups: any[] = [];
  loading = false;
  initializing = false;
  accountModal = false;
  saving = false;
  accountForm!: FormGroup;
  Number = Number;

  constructor(private service: AccountingService, private fb: FormBuilder, private message: NzMessageService) {}

  ngOnInit() {
    this.accountForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      type: ['ASSET', Validators.required],
      groupId: [null, Validators.required],
      description: ['']
    });
    this.loadData();
  }

  loadData() {
    this.loading = true;
    Promise.all([
      this.service.getAccounts().toPromise(),
      this.service.getAccountGroups().toPromise()
    ]).then(([accsRes, grpsRes]: any[]) => {
      const accs = accsRes.data?.data ?? accsRes.data ?? accsRes;
      const grps = grpsRes.data?.data ?? grpsRes.data ?? grpsRes;
      this.accounts = Array.isArray(accs) ? accs : [];
      this.groups = Array.isArray(grps) ? grps : [];
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  getTypeColor(type: string): string {
    return { ASSET:'gold', LIABILITY:'red', EQUITY:'purple', INCOME:'gold', EXPENSE:'orange' }[type] ?? 'default';
  }

  initialize() {
    this.initializing = true;
    this.service.initializeAccounts().subscribe({
      next: () => { this.message.success('Default chart of accounts created'); this.loadData(); this.initializing = false; },
      error: (e) => { this.message.error(e.error?.message ?? 'Failed'); this.initializing = false; }
    });
  }

  openAccountModal() { this.accountForm.reset({ type: 'ASSET' }); this.accountModal = true; }

  submitAccount() {
    if (this.accountForm.invalid) return;
    this.saving = true;
    this.service.createAccount(this.accountForm.value).subscribe({
      next: () => { this.message.success('Account created'); this.accountModal = false; this.loadData(); this.saving = false; },
      error: (e) => { this.message.error(e.error?.message ?? 'Failed'); this.saving = false; }
    });
  }
}
