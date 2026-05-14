import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { NzMessageService } from 'ng-zorro-antd/message';
import { PurchasesService } from '../services/purchases.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { VendorPayment } from '../models/purchases.model';

@Component({
  selector: 'app-vendor-payment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, NzCardModule, NzTableModule, NzButtonModule,
    NzIconModule, NzTagModule, NzModalModule, NzFormModule, NzInputModule, NzSelectModule,
    NzInputNumberModule, NzDatePickerModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Vendor Payments</h2>
          <p>Record and track payments to vendors</p>
        </div>
        <button nz-button nzType="primary" (click)="openModal()">
          <span nz-icon nzType="plus"></span> Record Payment
        </button>
      </div>

      <nz-table #table [nzData]="payments" [nzLoading]="loading" nzSize="middle">
        <thead>
          <tr>
            <th>Payment #</th>
            <th>Vendor</th>
            <th>Date</th>
            <th nzAlign="right">Amount</th>
            <th>Method</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let pay of table.data">
            <td><strong>{{ pay.paymentNumber }}</strong></td>
            <td>{{ pay.vendor?.name || '-' }}</td>
            <td>{{ pay.paymentDate | date:'dd MMM yyyy' }}</td>
            <td nzAlign="right" style="color:#9a4f12;font-weight:600">{{ pay.amount | number:'1.2-2' }}</td>
            <td><nz-tag>{{ pay.method }}</nz-tag></td>
            <td>{{ pay.reference || '-' }}</td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>

    <nz-modal [(nzVisible)]="modalVisible" nzTitle="Record Vendor Payment"
      (nzOnCancel)="modalVisible=false" (nzOnOk)="submit()" [nzOkLoading]="saving">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="form" nzLayout="vertical">
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Vendor</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="vendorId" nzShowSearch nzPlaceHolder="Select vendor">
                    <nz-option *ngFor="let v of vendors" [nzLabel]="v.name" [nzValue]="v.id"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Payment Date</nz-form-label>
                <nz-form-control>
                  <nz-date-picker formControlName="paymentDate" style="width:100%"></nz-date-picker>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Amount</nz-form-label>
                <nz-form-control>
                  <nz-input-number formControlName="amount" [nzMin]="0.01" [nzStep]="0.01" style="width:100%"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div nz-col [nzSpan]="12">
              <nz-form-item>
                <nz-form-label nzRequired>Payment Method</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="method">
                    <nz-option nzValue="CASH" nzLabel="Cash"></nz-option>
                    <nz-option nzValue="BANK_TRANSFER" nzLabel="Bank Transfer"></nz-option>
                    <nz-option nzValue="CHEQUE" nzLabel="Cheque"></nz-option>
                    <nz-option nzValue="UPI" nzLabel="UPI"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>
          </div>
          <nz-form-item>
            <nz-form-label>Reference</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="reference" placeholder="Cheque/UTR number" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Notes</nz-form-label>
            <nz-form-control>
              <textarea nz-input formControlName="notes" [nzAutosize]="{minRows:2,maxRows:3}"></textarea>
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
export class VendorPaymentListComponent implements OnInit {
  payments: VendorPayment[] = [];
  vendors: any[] = [];
  loading = false;
  modalVisible = false;
  saving = false;
  form!: FormGroup;

  constructor(
    private service: PurchasesService,
    private masterData: MasterDataService,
    private fb: FormBuilder,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      vendorId: [null, Validators.required],
      paymentDate: [new Date(), Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      method: ['BANK_TRANSFER', Validators.required],
      reference: [''],
      notes: ['']
    });
    this.loadData();
    this.masterData.getVendors().subscribe((res: any) => {
      const data = res.data?.data ?? res.data ?? res;
      this.vendors = Array.isArray(data) ? data : [];
    });
  }

  loadData() {
    this.loading = true;
    this.service.getVendorPayments().subscribe({
      next: (res: any) => {
        const data = res.data?.data ?? res.data ?? res;
        this.payments = Array.isArray(data) ? data : data.data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openModal() { this.form.reset({ paymentDate: new Date(), method: 'BANK_TRANSFER' }); this.modalVisible = true; }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    this.service.createVendorPayment(this.form.value).subscribe({
      next: () => { this.message.success('Payment recorded'); this.modalVisible = false; this.loadData(); this.saving = false; },
      error: (e) => { this.message.error(e.error?.message ?? 'Failed'); this.saving = false; }
    });
  }
}
