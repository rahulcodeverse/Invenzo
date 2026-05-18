import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReportsService } from '../services/reports.service';

@Component({
  selector: 'app-gst-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzGridModule,
    NzIconModule,
    NzSpinModule,
    NzStatisticModule,
    NzTableModule,
    NzTabsModule,
    NzTagModule,
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div>
          <h2>GST Reports</h2>
          <p>Output tax, input credit, payable tax, and invoice registers</p>
        </div>
        <div class="filters">
          <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="loadAll()"></nz-range-picker>
          <button nz-button nzType="primary" (click)="loadAll()">
            <span nz-icon nzType="reload"></span>
            Refresh
          </button>
          <button nz-button (click)="downloadCsv('gstr1')">
            <span nz-icon nzType="download"></span>
            GSTR-1 CSV
          </button>
          <button nz-button (click)="downloadCsv('gstr2')">
            <span nz-icon nzType="download"></span>
            GSTR-2 CSV
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <nz-spin nzTip="Loading GST reports..."></nz-spin>
      </div>

      <ng-container *ngIf="!loading">
        <div nz-row [nzGutter]="16" class="summary-grid">
          <div nz-col [nzXs]="24" [nzMd]="8">
            <nz-card>
              <nz-statistic nzTitle="Output GST" [nzValue]="summary?.sales?.outputTax || 0" nzPrefix="INR "
                [nzValueStyle]="{'color':'#9a4f12'}"></nz-statistic>
              <div class="stat-sub">From {{ summary?.sales?.invoices || 0 }} sales invoices</div>
            </nz-card>
          </div>
          <div nz-col [nzXs]="24" [nzMd]="8">
            <nz-card>
              <nz-statistic nzTitle="Input GST Credit" [nzValue]="summary?.purchases?.inputTax || 0" nzPrefix="INR "
                [nzValueStyle]="{'color':'#20312a'}"></nz-statistic>
              <div class="stat-sub">From {{ summary?.purchases?.invoices || 0 }} purchase invoices</div>
            </nz-card>
          </div>
          <div nz-col [nzXs]="24" [nzMd]="8">
            <nz-card>
              <nz-statistic nzTitle="Net GST Payable" [nzValue]="summary?.payable?.netTaxPayable || 0" nzPrefix="INR "
                [nzValueStyle]="{'color': payableColor}"></nz-statistic>
              <div class="stat-sub">{{ payableLabel }}</div>
            </nz-card>
          </div>
        </div>

        <div nz-row [nzGutter]="16" class="summary-grid">
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-card nzTitle="Sales Tax Split">
              <div class="tax-line"><span>Taxable Sales</span><strong>INR {{ summary?.sales?.taxableAmount || 0 | number:'1.2-2' }}</strong></div>
              <div class="tax-line"><span>CGST</span><strong>INR {{ summary?.sales?.cgst || 0 | number:'1.2-2' }}</strong></div>
              <div class="tax-line"><span>SGST</span><strong>INR {{ summary?.sales?.sgst || 0 | number:'1.2-2' }}</strong></div>
              <div class="tax-line"><span>IGST</span><strong>INR {{ summary?.sales?.igst || 0 | number:'1.2-2' }}</strong></div>
            </nz-card>
          </div>
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-card nzTitle="Purchase Tax Split">
              <div class="tax-line"><span>Taxable Purchases</span><strong>INR {{ summary?.purchases?.taxableAmount || 0 | number:'1.2-2' }}</strong></div>
              <div class="tax-line"><span>CGST Credit</span><strong>INR {{ summary?.purchases?.cgst || 0 | number:'1.2-2' }}</strong></div>
              <div class="tax-line"><span>SGST Credit</span><strong>INR {{ summary?.purchases?.sgst || 0 | number:'1.2-2' }}</strong></div>
              <div class="tax-line"><span>IGST Credit</span><strong>INR {{ summary?.purchases?.igst || 0 | number:'1.2-2' }}</strong></div>
            </nz-card>
          </div>
        </div>

        <nz-tabset>
          <nz-tab nzTitle="GSTR-1 Sales Register">
            <ng-container *ngTemplateOutlet="registerTable; context: { rows: gstr1.rows, totals: gstr1.totals, party: 'Customer' }"></ng-container>
          </nz-tab>
          <nz-tab nzTitle="GSTR-2 Purchase Register">
            <ng-container *ngTemplateOutlet="registerTable; context: { rows: gstr2.rows, totals: gstr2.totals, party: 'Vendor' }"></ng-container>
          </nz-tab>
        </nz-tabset>

        <ng-template #registerTable let-rows="rows" let-totals="totals" let-party="party">
          <nz-table [nzData]="rows" nzSize="middle" [nzPageSize]="20" [nzScroll]="{ x: '960px' }">
            <thead>
              <tr>
                <th>Document #</th>
                <th>Date</th>
                <th>{{ party }}</th>
                <th>GSTIN</th>
                <th nzAlign="right">Taxable</th>
                <th nzAlign="right">CGST</th>
                <th nzAlign="right">SGST</th>
                <th nzAlign="right">IGST</th>
                <th nzAlign="right">Total Tax</th>
                <th nzAlign="right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of rows">
                <td><strong>{{ row.documentNumber }}</strong></td>
                <td>{{ row.documentDate | date:'dd MMM yyyy' }}</td>
                <td>{{ row.partyName }}</td>
                <td>{{ row.gstNumber || '-' }}</td>
                <td nzAlign="right">INR {{ row.taxableAmount | number:'1.2-2' }}</td>
                <td nzAlign="right">INR {{ row.cgst | number:'1.2-2' }}</td>
                <td nzAlign="right">INR {{ row.sgst | number:'1.2-2' }}</td>
                <td nzAlign="right">INR {{ row.igst | number:'1.2-2' }}</td>
                <td nzAlign="right">INR {{ row.totalTax | number:'1.2-2' }}</td>
                <td nzAlign="right">INR {{ row.totalAmount | number:'1.2-2' }}</td>
                <td><nz-tag [nzColor]="getStatusColor(row.status)">{{ row.status }}</nz-tag></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"><strong>Total</strong></td>
                <td nzAlign="right"><strong>INR {{ totals?.taxableAmount || 0 | number:'1.2-2' }}</strong></td>
                <td nzAlign="right"><strong>INR {{ totals?.cgst || 0 | number:'1.2-2' }}</strong></td>
                <td nzAlign="right"><strong>INR {{ totals?.sgst || 0 | number:'1.2-2' }}</strong></td>
                <td nzAlign="right"><strong>INR {{ totals?.igst || 0 | number:'1.2-2' }}</strong></td>
                <td nzAlign="right"><strong>INR {{ totals?.totalTax || 0 | number:'1.2-2' }}</strong></td>
                <td nzAlign="right"><strong>INR {{ totals?.totalAmount || 0 | number:'1.2-2' }}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </nz-table>
        </ng-template>
      </ng-container>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:16px; }
    .page-header h2 { margin:0; font-size:24px; font-weight:600; }
    .page-header p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .filters { display:flex; align-items:center; gap:10px; }
    .loading { display:flex; justify-content:center; padding:48px; }
    .summary-grid { margin-bottom:16px; }
    .stat-sub { color:rgba(0,0,0,.45); margin-top:6px; }
    .tax-line { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f0f0f0; }
    .tax-line:last-child { border-bottom:0; }
    @media (max-width: 768px) {
      .page-header { align-items:flex-start; flex-direction:column; }
      .filters { width:100%; flex-direction:column; align-items:stretch; }
    }
  `],
})
export class GstReportComponent implements OnInit {
  dateRange: Date[] = [new Date(new Date().getFullYear(), 0, 1), new Date()];
  loading = false;
  summary: any = null;
  gstr1: any = { rows: [], totals: {} };
  gstr2: any = { rows: [], totals: {} };

  constructor(
    private readonly reportsService: ReportsService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get fromDate(): string {
    return this.dateRange?.[0]?.toISOString().split('T')[0] ?? '';
  }

  get toDate(): string {
    return this.dateRange?.[1]?.toISOString().split('T')[0] ?? '';
  }

  get payableColor(): string {
    return (this.summary?.payable?.netTaxPayable || 0) >= 0 ? '#9a4f12' : '#20312a';
  }

  get payableLabel(): string {
    return (this.summary?.payable?.netTaxPayable || 0) >= 0 ? 'Tax payable after input credit' : 'Input credit exceeds output tax';
  }

  loadAll(): void {
    this.loading = true;
    this.reportsService.getGstSummary(this.fromDate, this.toDate).subscribe({
      next: res => {
        this.summary = res.data ?? res;
        this.loadRegisters();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadRegisters(): void {
    let pendingRequests = 2;
    const markDone = () => {
      pendingRequests -= 1;
      this.loading = pendingRequests > 0;
    };

    this.reportsService.getGstr1(this.fromDate, this.toDate).subscribe({
      next: res => {
        this.gstr1 = res.data ?? res;
        markDone();
      },
      error: () => {
        markDone();
      },
    });

    this.reportsService.getGstr2(this.fromDate, this.toDate).subscribe({
      next: res => {
        this.gstr2 = res.data ?? res;
        markDone();
      },
      error: () => {
        markDone();
      },
    });
  }

  getStatusColor(status: string): string {
    return {
      PAID: '#20312a',
      PARTIAL: '#c56a1a',
      PENDING: 'gold',
      OVERDUE: 'red',
    }[status] ?? 'default';
  }

  downloadCsv(type: 'gstr1' | 'gstr2'): void {
    const request = type === 'gstr1'
      ? this.reportsService.downloadGstr1Csv(this.fromDate, this.toDate)
      : this.reportsService.downloadGstr2Csv(this.fromDate, this.toDate);

    request.subscribe({
      next: blob => {
        this.saveFile(blob, `${type}-${this.fromDate}-to-${this.toDate}.csv`);
        this.message.success('CSV export downloaded');
      },
      error: () => this.message.error('Unable to export GST CSV')
    });
  }

  private saveFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
