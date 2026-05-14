import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AccountingService } from '../services/accounting.service';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzIconModule, NzTagModule, NzModalModule, NzFormModule, NzInputModule, NzSelectModule,
    NzInputNumberModule, NzDatePickerModule, NzDividerModule, NzGridModule, NzSpaceModule,
    NzMessageModule, NzSpinModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Journal Entries</h2>
          <p>Double-entry bookkeeping ledger</p>
        </div>
        <button nz-button nzType="primary" (click)="openCreateModal()">
          <span nz-icon nzType="plus"></span> New Entry
        </button>
      </div>

      <nz-table #table [nzData]="entries" [nzLoading]="loading" [nzTotal]="total"
        [nzPageSize]="pageSize" [(nzPageIndex)]="page" (nzPageIndexChange)="loadData()"
        nzSize="middle" [nzFrontPagination]="false">
        <thead>
          <tr>
            <th nzWidth="40px"></th>
            <th>Journal #</th>
            <th>Date</th>
            <th>Type</th>
            <th>Narration</th>
            <th nzAlign="right">Debit</th>
            <th nzAlign="right">Credit</th>
            <th nzAlign="center">Status</th>
            <th nzAlign="center" nzWidth="80px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let e of table.data">
            <tr>
              <td [nzExpand]="expandSet.has(e.id)" (nzExpandChange)="onExpandChange(e.id, $event)"></td>
              <td><strong>{{ e.journalNumber }}</strong></td>
              <td>{{ e.date | date:'dd MMM yyyy' }}</td>
              <td><nz-tag>{{ e.type }}</nz-tag></td>
              <td>{{ e.narration }}</td>
              <td nzAlign="right">{{ e.totalDebit | number:'1.2-2' }}</td>
              <td nzAlign="right">{{ e.totalCredit | number:'1.2-2' }}</td>
              <td nzAlign="center">
                <nz-tag [nzColor]="e.isReversed ? 'red' : 'gold'">{{ e.isReversed ? 'Reversed' : 'Posted' }}</nz-tag>
              </td>
              <td nzAlign="center">
                <button nz-button nzType="default" nzSize="small" *ngIf="!e.isReversed && e.type === 'MANUAL'"
                  nzDanger (click)="reverse(e)">
                  <span nz-icon nzType="rollback"></span>
                </button>
              </td>
            </tr>
            <tr [nzExpand]="expandSet.has(e.id)">
              <td colspan="9" style="padding:0">
                <nz-table [nzData]="e.lines || []" nzSize="small" [nzShowPagination]="false" style="margin:8px 16px">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Narration</th>
                      <th nzAlign="right">Debit</th>
                      <th nzAlign="right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let line of e.lines">
                      <td>{{ line.account?.name || line.accountId }}</td>
                      <td>{{ line.narration || '-' }}</td>
                      <td nzAlign="right">{{ line.type === 'DEBIT' ? (line.amount | number:'1.2-2') : '-' }}</td>
                      <td nzAlign="right">{{ line.type === 'CREDIT' ? (line.amount | number:'1.2-2') : '-' }}</td>
                    </tr>
                  </tbody>
                </nz-table>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </nz-table>
    </nz-card>

    <nz-modal [(nzVisible)]="modalVisible" nzTitle="New Journal Entry"
      (nzOnCancel)="modalVisible=false" (nzOnOk)="submit()" [nzOkLoading]="saving" nzWidth="800px">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Date</nz-form-label>
                <nz-form-control>
                  <nz-date-picker formControlName="date" style="width:100%"></nz-date-picker>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Narration</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="narration" placeholder="Journal description" />
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>

          <nz-divider nzText="Lines (must balance)"></nz-divider>

          <div formArrayName="lines">
            <div *ngFor="let line of lines.controls; let i=index" [formGroupName]="i" style="margin-bottom:8px">
              <div nz-row [nzGutter]="8" style="align-items:flex-end">
                <div nz-col [nzSpan]="8">
                  <nz-select formControlName="accountId" nzShowSearch nzPlaceHolder="Account" style="width:100%">
                    <nz-option *ngFor="let a of accounts" [nzLabel]="a.name + ' (' + a.code + ')'" [nzValue]="a.id"></nz-option>
                  </nz-select>
                </div>
                <div nz-col [nzSpan]="4">
                  <nz-select formControlName="type" style="width:100%" (ngModelChange)="calcBalance()">
                    <nz-option nzValue="DEBIT" nzLabel="Debit"></nz-option>
                    <nz-option nzValue="CREDIT" nzLabel="Credit"></nz-option>
                  </nz-select>
                </div>
                <div nz-col [nzSpan]="5">
                  <nz-input-number formControlName="amount" [nzMin]="0.01" [nzStep]="0.01" style="width:100%" (ngModelChange)="calcBalance()"></nz-input-number>
                </div>
                <div nz-col [nzSpan]="5">
                  <input nz-input formControlName="narration" placeholder="Line narration" />
                </div>
                <div nz-col [nzSpan]="2">
                  <button nz-button nzDanger nzType="text" (click)="removeLine(i)" [disabled]="lines.length <= 2">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button nz-button nzType="dashed" style="width:100%;margin:8px 0" (click)="addLine()">
            <span nz-icon nzType="plus"></span> Add Line
          </button>

          <div [class.balance-ok]="isBalanced" [class.balance-error]="!isBalanced" class="balance-info">
            <span>Total Debit: <strong>{{ totalDebit | number:'1.2-2' }}</strong></span>
            <span style="margin:0 16px">Total Credit: <strong>{{ totalCredit | number:'1.2-2' }}</strong></span>
            <span>{{ isBalanced ? '✓ Balanced' : '✗ Not balanced' }}</span>
          </div>
        </form>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .balance-info { padding:8px 12px; border-radius:4px; background:#f5f5f5; }
    .balance-ok { background:#fff4e8; border:1px solid #e6c29a; color:#9a4f12; }
    .balance-error { background:#fff2f0; border:1px solid #ffccc7; color:#ff4d4f; }
  `]
})
export class JournalListComponent implements OnInit {
  entries: any[] = [];
  accounts: any[] = [];
  loading = false;
  total = 0;
  page = 1;
  pageSize = 20;
  modalVisible = false;
  saving = false;
  expandSet = new Set<string>();
  form!: FormGroup;
  totalDebit = 0;
  totalCredit = 0;
  get isBalanced(): boolean { return this.totalDebit > 0 && Math.abs(this.totalDebit - this.totalCredit) < 0.01; }

  constructor(private service: AccountingService, private fb: FormBuilder, private message: NzMessageService) {}

  ngOnInit() {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      narration: ['', Validators.required],
      lines: this.fb.array([this.createLine(), this.createLine()])
    });
    this.loadData();
    this.service.getAccounts().subscribe((res: any) => {
      const data = res.data?.data ?? res.data ?? res;
      this.accounts = Array.isArray(data) ? data : [];
    });
  }

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  createLine() {
    return this.fb.group({ accountId: [null, Validators.required], type: ['DEBIT', Validators.required], amount: [null, [Validators.required, Validators.min(0.01)]], narration: [''] });
  }

  addLine() { this.lines.push(this.createLine()); }
  removeLine(i: number) { this.lines.removeAt(i); this.calcBalance(); }

  calcBalance() {
    this.totalDebit = this.lines.controls.filter(c => c.get('type')?.value === 'DEBIT').reduce((s, c) => s + (c.get('amount')?.value ?? 0), 0);
    this.totalCredit = this.lines.controls.filter(c => c.get('type')?.value === 'CREDIT').reduce((s, c) => s + (c.get('amount')?.value ?? 0), 0);
  }

  loadData() {
    this.loading = true;
    this.service.getJournalEntries({ page: this.page, limit: this.pageSize }).subscribe({
      next: (res: any) => {
        const data = res.data?.data ?? res.data ?? res;
        this.entries = Array.isArray(data) ? data : data.data ?? [];
        this.total = res.data?.meta?.total ?? res.meta?.total ?? this.entries.length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onExpandChange(id: string, checked: boolean) {
    if (checked) this.expandSet.add(id); else this.expandSet.delete(id);
    if (checked) {
      this.service.getJournalEntry(id).subscribe((res: any) => {
        const entry = res.data ?? res;
        const idx = this.entries.findIndex(e => e.id === id);
        if (idx >= 0) this.entries[idx] = { ...this.entries[idx], lines: entry.lines };
      });
    }
  }

  openCreateModal() {
    this.form.reset({ date: new Date() });
    while (this.lines.length) this.lines.removeAt(0);
    this.lines.push(this.createLine());
    this.lines.push(this.createLine());
    this.totalDebit = 0; this.totalCredit = 0;
    this.modalVisible = true;
  }

  reverse(entry: any) {
    this.service.reverseJournal(entry.id).subscribe({
      next: () => { this.message.success('Entry reversed'); this.loadData(); },
      error: (e) => this.message.error(e.error?.message ?? 'Failed')
    });
  }

  submit() {
    if (this.form.invalid || !this.isBalanced) { this.message.error('Entry must be balanced'); return; }
    this.saving = true;
    const val = { ...this.form.value, type: 'MANUAL', totalDebit: this.totalDebit, totalCredit: this.totalCredit };
    this.service.createJournalEntry(val).subscribe({
      next: () => { this.message.success('Journal entry posted'); this.modalVisible = false; this.loadData(); this.saving = false; },
      error: (e) => { this.message.error(e.error?.message ?? 'Failed'); this.saving = false; }
    });
  }
}
