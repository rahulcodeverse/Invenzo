import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SalesService } from '../../services/sales.service';
import { DeliveryNote } from '../../models/sales.model';

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NzCardModule, NzTableModule, NzButtonModule, NzIconModule, NzTagModule],
  template: `
    <nz-card>
      <div class="page-header">
        <div>
          <h2>Delivery Notes</h2>
          <p>Track goods dispatched against confirmed sales orders</p>
        </div>
        <button nz-button nzType="primary" (click)="createDelivery()">
          <span nz-icon nzType="plus"></span>
          New Delivery
        </button>
      </div>

      <nz-table #table [nzData]="deliveries" [nzLoading]="loading" [nzTotal]="total"
        [nzPageSize]="pageSize" [nzPageIndex]="pageIndex" [nzFrontPagination]="false"
        (nzPageIndexChange)="onPageChange($event)">
        <thead>
          <tr>
            <th>Delivery #</th>
            <th>Sales Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th nzAlign="right">Items</th>
            <th>Warehouse</th>
            <th nzAlign="center" nzWidth="80px">PDF</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let delivery of table.data">
            <td><nz-tag nzColor="gold">{{ delivery.deliveryNumber }}</nz-tag></td>
            <td>{{ delivery.salesOrder?.soNumber || delivery.salesOrder?.orderNumber || '-' }}</td>
            <td>{{ delivery.salesOrder?.customer?.name || delivery.salesOrder?.customer || '-' }}</td>
            <td>{{ delivery.deliveryDate | date:'dd/MM/yyyy' }}</td>
            <td nzAlign="right">{{ delivery.items.length }}</td>
            <td>{{ delivery.warehouse?.name || '-' }}</td>
            <td nzAlign="center">
              <button nz-button nzSize="small" (click)="downloadPdf(delivery)">
                <span nz-icon nzType="download"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:600; }
    .page-header p { margin:4px 0 0; color:rgba(0,0,0,.45); }
  `]
})
export class DeliveryListComponent implements OnInit {
  deliveries: DeliveryNote[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 20;

  constructor(
    private salesService: SalesService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.loading = true;
    this.salesService.getDeliveryNotes({ page: this.pageIndex, limit: this.pageSize }).subscribe({
      next: res => {
        this.deliveries = res.data;
        this.total = res.meta.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadDeliveries();
  }

  createDelivery(): void {
    this.router.navigate(['/sales/delivery/new']);
  }

  downloadPdf(delivery: DeliveryNote): void {
    this.salesService.downloadDeliveryChallanPdf(delivery.id).subscribe({
      next: blob => {
        this.savePdf(blob, `delivery-challan-${delivery.deliveryNumber}.pdf`);
        this.message.success('Delivery challan downloaded');
      },
      error: () => this.message.error('Unable to download delivery challan')
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
