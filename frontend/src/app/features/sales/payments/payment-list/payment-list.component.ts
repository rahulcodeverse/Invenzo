import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CustomerPayment } from '../../models/sales.model';
import { SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Customer Payments</h2>
          <p>Review receipts and download payment acknowledgements</p>
        </div>
        <button nz-button nzType="primary" (click)="recordPayment()">
          <span nz-icon nzType="plus"></span>
          Record Payment
        </button>
      </div>

      <nz-table
        #table
        [nzData]="payments"
        [nzLoading]="loading"
        [nzTotal]="total"
        [nzPageSize]="pageSize"
        [nzPageIndex]="pageIndex"
        [nzFrontPagination]="false"
        (nzPageIndexChange)="onPageChange($event)"
      >
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Customer</th>
            <th>Invoice</th>
            <th>Date</th>
            <th nzAlign="right">Amount</th>
            <th>Method</th>
            <th>Reference</th>
            <th nzAlign="center" nzWidth="80px">PDF</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let payment of table.data">
            <td><strong>{{ payment.paymentNumber }}</strong></td>
            <td>{{ payment.customer?.name || '-' }}</td>
            <td>{{ payment.invoice?.invoiceNumber || '-' }}</td>
            <td>{{ payment.paymentDate | date:'dd MMM yyyy' }}</td>
            <td nzAlign="right" class="amount">{{ payment.amount | number:'1.2-2' }}</td>
            <td><nz-tag>{{ payment.paymentMethod }}</nz-tag></td>
            <td>{{ payment.reference || '-' }}</td>
            <td nzAlign="center">
              <button nz-button nzSize="small" (click)="downloadReceipt(payment)">
                <span nz-icon nzType="download"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 16px;
    }

    .header-left h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .header-left p {
      margin: 4px 0 0;
      color: var(--invenzo-muted);
    }

    .amount {
      color: #9a4f12;
      font-weight: 700;
    }
  `]
})
export class PaymentListComponent implements OnInit {
  payments: CustomerPayment[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  constructor(
    private readonly salesService: SalesService,
    private readonly router: Router,
    private readonly message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.salesService.getCustomerPayments({ page: this.pageIndex, limit: this.pageSize }).subscribe({
      next: res => {
        this.payments = res.data;
        this.total = res.meta.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadPayments();
  }

  recordPayment(): void {
    this.router.navigate(['/sales/payments/new']);
  }

  downloadReceipt(payment: CustomerPayment): void {
    this.salesService.downloadCustomerPaymentPdf(payment.id).subscribe({
      next: blob => {
        this.savePdf(blob, `customer-payment-${payment.paymentNumber}.pdf`);
        this.message.success('Payment receipt downloaded');
      },
      error: () => this.message.error('Unable to download payment receipt'),
    });
  }

  private savePdf(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
