import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ManufacturingService } from './services/manufacturing.service';

@Component({
  selector: 'app-mrp-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzGridModule,
    NzIconModule,
    NzStatisticModule,
    NzTableModule,
    NzTagModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>MRP Planning</h2>
        <p>Plan raw material shortages from confirmed sales demand, BOMs, current stock, and open indents.</p>
      </div>
      <div class="actions">
        <nz-date-picker [(ngModel)]="requiredBy" nzPlaceHolder="Required by"></nz-date-picker>
        <button nz-button (click)="load()" [nzLoading]="loading">
          <span nz-icon nzType="reload"></span>
        </button>
        <button nz-button nzType="primary" (click)="generateIndents()" [disabled]="!shortageCount" [nzLoading]="generating">
          Generate Indents
        </button>
      </div>
    </div>

    <div nz-row [nzGutter]="16" class="summary-row">
      <div nz-col [nzXs]="24" [nzMd]="8">
        <nz-card><nz-statistic nzTitle="Demand Orders" [nzValue]="mrp?.demandOrders || 0"></nz-statistic></nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="8">
        <nz-card><nz-statistic nzTitle="Shortage Items" [nzValue]="shortageCount" [nzValueStyle]="{ color: '#9a4f12' }"></nz-statistic></nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzMd]="8">
        <nz-card><nz-statistic nzTitle="Planned Lines" [nzValue]="lines.length"></nz-statistic></nz-card>
      </div>
    </div>

    <nz-card>
      <nz-table [nzData]="lines" [nzLoading]="loading" nzSize="middle">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th nzAlign="right">Required</th>
            <th nzAlign="right">Available</th>
            <th nzAlign="right">Open Indent</th>
            <th nzAlign="right">Shortage</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let line of lines">
            <td>
              <strong>{{ line.product?.name }}</strong><br>
              <small>{{ line.product?.sku }}</small>
            </td>
            <td><nz-tag [nzColor]="line.isMaterial ? 'orange' : 'gold'">{{ line.isMaterial ? 'Material' : 'Finished' }}</nz-tag></td>
            <td nzAlign="right">{{ line.requiredQty | number:'1.0-3' }}</td>
            <td nzAlign="right">{{ line.availableQty | number:'1.0-3' }}</td>
            <td nzAlign="right">{{ line.openIndentQty | number:'1.0-3' }}</td>
            <td nzAlign="right"><strong>{{ line.shortageQty | number:'1.0-3' }}</strong></td>
            <td><nz-tag [nzColor]="line.shortageQty > 0 ? 'red' : 'green'">{{ line.action }}</nz-tag></td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:750; }
    .page-header p { margin:4px 0 0; color:#6f675f; }
    .actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .summary-row { margin-bottom:16px; }
    @media (max-width: 760px) { .page-header { align-items:flex-start; flex-direction:column; } }
  `],
})
export class MrpPlanningComponent implements OnInit {
  loading = false;
  generating = false;
  requiredBy?: Date;
  mrp: any = null;
  lines: any[] = [];

  constructor(
    private readonly manufacturingService: ManufacturingService,
    private readonly message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get shortageCount(): number {
    return this.lines.filter(line => line.shortageQty > 0).length;
  }

  load(): void {
    this.loading = true;
    this.manufacturingService.getMrp(this.dateValue()).subscribe({
      next: res => {
        this.mrp = res.data ?? res;
        this.lines = this.mrp.lines ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  generateIndents(): void {
    this.generating = true;
    this.manufacturingService.generatePurchaseIndents(this.dateValue()).subscribe({
      next: res => {
        const data = res.data ?? res;
        this.message.success(`${data.created || 0} purchase indents generated`);
        this.generating = false;
        this.load();
      },
      error: () => { this.generating = false; },
    });
  }

  private dateValue(): string | undefined {
    return this.requiredBy ? this.requiredBy.toISOString().slice(0, 10) : undefined;
  }
}
