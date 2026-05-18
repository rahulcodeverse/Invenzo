import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { forkJoin } from 'rxjs';
import { SalesService } from '../../services/sales.service';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { Customer } from '../../../../core/models/master-data.model';
import { SalesInvoice, PaymentMethod } from '../../models/sales.model';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule,
    NzSelectModule, NzButtonModule, NzInputNumberModule, NzDatePickerModule,
    NzGridModule, NzIconModule, NzDividerModule, NzTableModule, NzCheckboxModule,
    NzAlertModule, PageHeaderComponent
  ],
  template: `
    <nz-card>
      <app-page-header
        title="Record Customer Payment"
        subtitle="Allocate payment against customer invoices"
        backLink="/sales/invoices"
      ></app-page-header>

      <nz-alert nzType="info" nzMessage="Payment Allocation"
                nzDescription="Select customer to view outstanding invoices. Payment will be allocated to selected invoices."
                nzShowIcon style="margin-bottom: 24px;"></nz-alert>

      <form nz-form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" nzLayout="vertical">
        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Customer</nz-form-label>
              <nz-form-control nzErrorTip="Please select customer">
                <nz-select formControlName="customerId" nzShowSearch nzPlaceHolder="Select customer"
                          (ngModelChange)="onCustomerChange()">
                  <nz-option *ngFor="let c of customers" [nzLabel]="c.name" [nzValue]="c.id"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Payment Date</nz-form-label>
              <nz-form-control>
                <nz-date-picker formControlName="paymentDate" style="width: 100%;"></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="6">
            <nz-form-item>
              <nz-form-label nzRequired>Amount</nz-form-label>
              <nz-form-control nzErrorTip="Please enter amount">
                <nz-input-number formControlName="amount" [nzMin]="0" [nzStep]="0.01"
                                style="width: 100%;" placeholder="0.00"
                                (ngModelChange)="onAmountChange()"></nz-input-number>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <div nz-row [nzGutter]="16">
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Payment Method</nz-form-label>
              <nz-form-control nzErrorTip="Please select payment method">
                <nz-select formControlName="paymentMethod" nzPlaceHolder="Select method">
                  <nz-option nzLabel="Cash" nzValue="CASH"></nz-option>
                  <nz-option nzLabel="Bank Transfer" nzValue="BANK_TRANSFER"></nz-option>
                  <nz-option nzLabel="Cheque" nzValue="CHEQUE"></nz-option>
                  <nz-option nzLabel="Credit Card" nzValue="CREDIT_CARD"></nz-option>
                  <nz-option nzLabel="UPI" nzValue="UPI"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
          <div nz-col [nzSpan]="12">
            <nz-form-item>
              <nz-form-label>Reference Number</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="reference" placeholder="Transaction ID, Cheque No, etc." />
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>

        <nz-divider nzText="Outstanding Invoices"></nz-divider>

        <nz-alert *ngIf="!outstandingInvoices.length && paymentForm.get('customerId')?.value"
                  nzType="success" nzMessage="No outstanding invoices"
                  nzDescription="This customer has no pending invoices." style="margin-bottom: 16px;"></nz-alert>

        <nz-table *ngIf="outstandingInvoices.length > 0" [nzData]="outstandingInvoices"
                  [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th nzWidth="5%"></th>
              <th nzWidth="20%">Invoice #</th>
              <th nzWidth="15%">Date</th>
              <th nzWidth="15%">Due Date</th>
              <th nzAlign="right" nzWidth="15%">Total</th>
              <th nzAlign="right" nzWidth="15%">Balance</th>
              <th nzAlign="right" nzWidth="15%">Allocate</th>
            </tr>
          </thead>
          <tbody formArrayName="invoiceAllocations">
            <tr *ngFor="let invoice of outstandingInvoices; let i = index" [formGroupName]="i">
              <td>
                <label nz-checkbox formControlName="selected" (ngModelChange)="onInvoiceSelect(i)"></label>
              </td>
              <td><strong>{{ invoice.invoiceNumber }}</strong></td>
              <td>{{ invoice.invoiceDate | date:'dd/MM/yyyy' }}</td>
              <td>{{ invoice.dueDate | date:'dd/MM/yyyy' }}</td>
              <td nzAlign="right">₹{{ invoice.totalAmount.toLocaleString() }}</td>
              <td nzAlign="right">
                <strong [class.text-danger]="invoice.balanceAmount > 0">
                  ₹{{ invoice.balanceAmount.toLocaleString() }}
                </strong>
              </td>
              <td nzAlign="right">
                <nz-input-number formControlName="amount" [nzMin]="0"
                                [nzMax]="invoice.balanceAmount" [nzStep]="0.01"
                                style="width: 120px;" [nzDisabled]="!invoiceAllocations.at(i).get('selected')?.value"
                                (ngModelChange)="calculateTotalAllocation()"></nz-input-number>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <div class="allocation-summary" *ngIf="outstandingInvoices.length > 0">
          <div class="summary-row">
            <span>Payment Amount:</span>
            <strong>₹{{ paymentForm.get('amount')?.value?.toLocaleString() || 0 }}</strong>
          </div>
          <div class="summary-row">
            <span>Total Allocated:</span>
            <strong [class.text-success]="totalAllocated === paymentForm.get('amount')?.value"
                    [class.text-warning]="totalAllocated !== paymentForm.get('amount')?.value">
              ₹{{ totalAllocated.toLocaleString() }}
            </strong>
          </div>
          <div class="summary-row">
            <span>Unallocated:</span>
            <strong [class.text-danger]="(paymentForm.get('amount')?.value || 0) - totalAllocated > 0">
              ₹{{ ((paymentForm.get('amount')?.value || 0) - totalAllocated).toLocaleString() }}
            </strong>
          </div>
        </div>

        <nz-form-item style="margin-top: 16px;">
          <nz-form-label>Notes</nz-form-label>
          <nz-form-control>
            <textarea nz-input formControlName="notes" [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                      placeholder="Optional payment notes"></textarea>
          </nz-form-control>
        </nz-form-item>

        <div class="form-actions">
          <button nz-button nzType="default" (click)="onCancel()">Cancel</button>
          <button nz-button nzType="primary" type="submit" [nzLoading]="saving"
                  [disabled]="!paymentForm.valid || totalAllocated === 0">
            <span nz-icon nzType="check"></span>
            Record Payment
          </button>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 600; }
    .page-header p { margin: 4px 0 0; color: rgba(0, 0, 0, 0.45); }
    .text-danger { color: #cf1322; }
    .text-success { color: #9a4f12; }
    .text-warning { color: #faad14; }
    .allocation-summary { max-width: 400px; margin-left: auto; margin-top: 16px; padding: 16px; background: #f0f2f5; border-radius: 4px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; }
  `]
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  customers: Customer[] = [];
  outstandingInvoices: SalesInvoice[] = [];
  totalAllocated = 0;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
    private masterDataService: MasterDataService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCustomers();

    // Check if invoice ID passed via query params
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');
    if (invoiceId) {
      this.loadInvoiceAndCustomer(invoiceId);
    }
  }

  initForm(): void {
    this.paymentForm = this.fb.group({
      customerId: [null, [Validators.required]],
      paymentDate: [new Date(), [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: [null, [Validators.required]],
      reference: [''],
      notes: [''],
      invoiceAllocations: this.fb.array([])
    });
  }

  loadCustomers(): void {
    this.masterDataService.getCustomers({ limit: 200 }).subscribe({
      next: (res) => { this.customers = res.data; }
    });
  }

  loadInvoiceAndCustomer(invoiceId: string): void {
    this.salesService.getSalesInvoiceById(invoiceId).subscribe({
      next: (res) => {
        const invoice = res.data;
        this.paymentForm.patchValue({
          customerId: invoice.customerId,
          amount: invoice.balanceAmount
        });
        this.onCustomerChange();
      }
    });
  }

  get invoiceAllocations(): FormArray {
    return this.paymentForm.get('invoiceAllocations') as FormArray;
  }

  onCustomerChange(): void {
    const customerId = this.paymentForm.get('customerId')?.value;
    if (customerId) {
      this.loading = true;
      this.salesService.getSalesInvoices({ customerId }).subscribe({
        next: (res) => {
          this.outstandingInvoices = res.data.filter(inv => inv.balanceAmount > 0);
          this.invoiceAllocations.clear();
          this.outstandingInvoices.forEach(invoice => {
            this.invoiceAllocations.push(this.fb.group({
              invoiceId: [invoice.id],
              selected: [false],
              amount: [0]
            }));
          });
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }

  onInvoiceSelect(index: number): void {
    const allocation = this.invoiceAllocations.at(index);
    const selected = allocation.get('selected')?.value;

    if (selected) {
      // Auto-fill with balance amount or remaining payment
      const invoice = this.outstandingInvoices[index];
      const paymentAmount = this.paymentForm.get('amount')?.value || 0;
      const currentAllocated = this.totalAllocated - (allocation.get('amount')?.value || 0);
      const remaining = paymentAmount - currentAllocated;
      const allocateAmount = Math.min(invoice.balanceAmount, remaining);
      allocation.patchValue({ amount: allocateAmount });
    } else {
      allocation.patchValue({ amount: 0 });
    }

    this.calculateTotalAllocation();
  }

  onAmountChange(): void {
    this.calculateTotalAllocation();
  }

  calculateTotalAllocation(): void {
    this.totalAllocated = this.invoiceAllocations.controls.reduce((sum, control) => {
      const selected = control.get('selected')?.value;
      const amount = control.get('amount')?.value || 0;
      return sum + (selected ? amount : 0);
    }, 0);
  }

  onSubmit(): void {
    if (this.paymentForm.valid && this.totalAllocated > 0) {
      this.saving = true;

      const allocations = this.invoiceAllocations.controls
        .filter(c => c.get('selected')?.value && c.get('amount')?.value > 0)
        .map(c => ({
          invoiceId: c.get('invoiceId')?.value,
          amount: c.get('amount')?.value
        }));

      const requests = allocations.map(allocation => this.salesService.createCustomerPayment({
        customerId: this.paymentForm.get('customerId')?.value,
        invoiceId: allocation.invoiceId,
        paymentDate: this.paymentForm.get('paymentDate')?.value,
        amount: allocation.amount,
        paymentMethod: this.paymentForm.get('paymentMethod')?.value,
        reference: this.paymentForm.get('reference')?.value,
        notes: this.paymentForm.get('notes')?.value
      } as any));

      forkJoin(requests).subscribe({
        next: () => {
          this.message.success('Payment recorded successfully');
          this.router.navigate(['/sales/invoices']);
        },
        error: () => { this.saving = false; },
        complete: () => { this.saving = false; }
      });
    } else if (this.totalAllocated === 0) {
      this.message.warning('Please allocate payment to at least one invoice');
    }
  }

  onCancel(): void {
    this.router.navigate(['/sales/invoices']);
  }
}

