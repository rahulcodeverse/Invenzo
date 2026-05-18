import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ManufacturingService } from './services/manufacturing.service';

@Component({
  selector: 'app-purchase-indent-list',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzCardModule, NzTableModule, NzTagModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Purchase Indents</h2>
        <p>MRP-generated material shortages ready for purchase planning.</p>
      </div>
    </div>

    <nz-card>
      <nz-table [nzData]="indents" [nzLoading]="loading">
        <thead>
          <tr>
            <th>Indent</th>
            <th>Item</th>
            <th>Source</th>
            <th nzAlign="right">Required</th>
            <th nzAlign="right">Available</th>
            <th nzAlign="right">Shortage</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let indent of indents">
            <td><strong>{{ indent.indentNumber }}</strong><br><small>{{ indent.requiredBy | date:'mediumDate' }}</small></td>
            <td>{{ indent.product?.name }}<br><small>{{ indent.product?.sku }}</small></td>
            <td>{{ indent.sourceReference || indent.sourceType }}</td>
            <td nzAlign="right">{{ indent.requiredQty | number:'1.0-3' }}</td>
            <td nzAlign="right">{{ indent.availableQty | number:'1.0-3' }}</td>
            <td nzAlign="right"><strong>{{ indent.shortageQty | number:'1.0-3' }}</strong></td>
            <td><nz-tag [nzColor]="statusColor(indent.status)">{{ indent.status }}</nz-tag></td>
            <td>
              <button nz-button nzSize="small" *ngIf="indent.status === 'OPEN'" (click)="updateStatus(indent, 'APPROVED')">
                Approve
              </button>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`.page-header{margin-bottom:20px}.page-header h2{margin:0;font-size:24px;font-weight:750}.page-header p{margin:4px 0 0;color:#6f675f}`],
})
export class PurchaseIndentListComponent implements OnInit {
  loading = false;
  indents: any[] = [];

  constructor(
    private readonly manufacturingService: ManufacturingService,
    private readonly message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.manufacturingService.getPurchaseIndents().subscribe({
      next: res => {
        this.indents = res.data?.data ?? res.data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  updateStatus(indent: any, status: string): void {
    this.manufacturingService.updatePurchaseIndent(indent.id, status).subscribe({
      next: () => {
        this.message.success(`Indent ${status.toLowerCase()}`);
        this.load();
      },
    });
  }

  statusColor(status: string): string {
    return { OPEN: 'gold', APPROVED: 'orange', CONVERTED: 'green', CANCELLED: 'red' }[status] || 'default';
  }
}
