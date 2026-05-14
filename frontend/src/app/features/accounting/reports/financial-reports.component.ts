import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { AccountingService } from '../services/accounting.service';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzTableModule, NzButtonModule, NzIconModule,
    NzTagModule, NzTabsModule, NzDatePickerModule, NzGridModule, NzSpinModule,
    NzStatisticModule, NzDividerModule, NzEmptyModule
  ],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Financial Reports</h2>
          <p>Trial Balance, P&L, Balance Sheet, Cash Flow</p>
        </div>
        <div class="date-range">
          <nz-range-picker [(ngModel)]="dateRange" (ngModelChange)="onDateChange($event)"></nz-range-picker>
          <button nz-button nzType="primary" (click)="loadCurrentTab()" style="margin-left:8px">
            <span nz-icon nzType="search"></span> Generate
          </button>
        </div>
      </div>

      <nz-tabset [(nzSelectedIndex)]="activeTab" (nzSelectChange)="onTabChange($event)">

        <!-- Trial Balance -->
        <nz-tab nzTitle="Trial Balance">
          <div *ngIf="loadingTB" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-empty *ngIf="!loadingTB && !trialBalance" nzNotFoundContent="Click Generate to load data"></nz-empty>
          <div *ngIf="trialBalance && !loadingTB">
            <div nz-row [nzGutter]="16" style="margin-bottom:16px">
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Total Debit" [nzValue]="trialBalance.totalDebit" [nzValueStyle]="{'color':'#1890ff'}" nzPrefix="₹" ></nz-statistic>
              </div>
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Total Credit" [nzValue]="trialBalance.totalCredit" [nzValueStyle]="{'color':'#52c41a'}" nzPrefix="₹" ></nz-statistic>
              </div>
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Difference" [nzValue]="trialBalance.totalDebit - trialBalance.totalCredit"
                  [nzValueStyle]="{'color': trialBalance.totalDebit === trialBalance.totalCredit ? '#52c41a' : '#ff4d4f'}" nzPrefix="₹" ></nz-statistic>
              </div>
            </div>
            <nz-table [nzData]="trialBalance.accounts || []" nzSize="middle" [nzShowPagination]="false">
              <thead>
                <tr><th>Account Code</th><th>Account Name</th><th>Type</th><th nzAlign="right">Debit</th><th nzAlign="right">Credit</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let acc of trialBalance.accounts">
                  <td>{{ acc.code }}</td>
                  <td>{{ acc.name }}</td>
                  <td><nz-tag>{{ acc.type }}</nz-tag></td>
                  <td nzAlign="right">{{ acc.debit > 0 ? (acc.debit | number:'1.2-2') : '-' }}</td>
                  <td nzAlign="right">{{ acc.credit > 0 ? (acc.credit | number:'1.2-2') : '-' }}</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-tab>

        <!-- Profit & Loss -->
        <nz-tab nzTitle="Profit & Loss">
          <div *ngIf="loadingPL" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-empty *ngIf="!loadingPL && !profitLoss" nzNotFoundContent="Click Generate to load data"></nz-empty>
          <div *ngIf="profitLoss && !loadingPL">
            <div nz-row [nzGutter]="16" style="margin-bottom:24px">
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Total Revenue" [nzValue]="profitLoss.totalIncome" [nzValueStyle]="{'color':'#52c41a'}" nzPrefix="₹" ></nz-statistic>
              </div>
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Total Expenses" [nzValue]="profitLoss.totalExpense" [nzValueStyle]="{'color':'#ff4d4f'}" nzPrefix="₹" ></nz-statistic>
              </div>
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Net Profit / (Loss)" [nzValue]="profitLoss.netProfit"
                  [nzValueStyle]="{'color': profitLoss.netProfit >= 0 ? '#52c41a' : '#ff4d4f'}" nzPrefix="₹" ></nz-statistic>
              </div>
            </div>
            <div nz-row [nzGutter]="24">
              <div nz-col [nzSpan]="12">
                <nz-divider nzText="Income"></nz-divider>
                <nz-table [nzData]="profitLoss.income || []" nzSize="small" [nzShowPagination]="false">
                  <thead><tr><th>Account</th><th nzAlign="right">Amount</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of profitLoss.income">
                      <td>{{ r.name }}</td><td nzAlign="right" style="color:#52c41a">{{ r.balance | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </nz-table>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-divider nzText="Expenses"></nz-divider>
                <nz-table [nzData]="profitLoss.expenses || []" nzSize="small" [nzShowPagination]="false">
                  <thead><tr><th>Account</th><th nzAlign="right">Amount</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of profitLoss.expenses">
                      <td>{{ r.name }}</td><td nzAlign="right" style="color:#ff4d4f">{{ r.balance | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </nz-table>
              </div>
            </div>
          </div>
        </nz-tab>

        <!-- Balance Sheet -->
        <nz-tab nzTitle="Balance Sheet">
          <div *ngIf="loadingBS" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-empty *ngIf="!loadingBS && !balanceSheet" nzNotFoundContent="Click Generate to load data"></nz-empty>
          <div *ngIf="balanceSheet && !loadingBS">
            <div nz-row [nzGutter]="24">
              <div nz-col [nzSpan]="12">
                <nz-divider nzText="Assets"></nz-divider>
                <nz-table [nzData]="balanceSheet.assets || []" nzSize="small" [nzShowPagination]="false">
                  <thead><tr><th>Account</th><th nzAlign="right">Balance</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of balanceSheet.assets">
                      <td>{{ r.name }}</td><td nzAlign="right">{{ r.balance | number:'1.2-2' }}</td>
                    </tr>
                    <tr style="font-weight:700;background:#f0f8ff">
                      <td>Total Assets</td><td nzAlign="right">{{ balanceSheet.totalAssets | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </nz-table>
              </div>
              <div nz-col [nzSpan]="12">
                <nz-divider nzText="Liabilities & Equity"></nz-divider>
                <nz-table [nzData]="(balanceSheet.liabilities || []).concat(balanceSheet.equity || [])" nzSize="small" [nzShowPagination]="false">
                  <thead><tr><th>Account</th><th nzAlign="right">Balance</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let r of (balanceSheet.liabilities || []).concat(balanceSheet.equity || [])">
                      <td>{{ r.name }}</td><td nzAlign="right">{{ r.balance | number:'1.2-2' }}</td>
                    </tr>
                    <tr style="font-weight:700;background:#fff0f6">
                      <td>Total Liabilities & Equity</td><td nzAlign="right">{{ (balanceSheet.totalLiabilities || 0) + (balanceSheet.totalEquity || 0) | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </nz-table>
              </div>
            </div>
          </div>
        </nz-tab>

        <!-- Cash Flow -->
        <nz-tab nzTitle="Cash Flow">
          <div *ngIf="loadingCF" class="loading"><nz-spin nzTip="Loading..."></nz-spin></div>
          <nz-empty *ngIf="!loadingCF && !cashFlow" nzNotFoundContent="Click Generate to load data"></nz-empty>
          <div *ngIf="cashFlow && !loadingCF">
            <div nz-row [nzGutter]="16" style="margin-bottom:16px">
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Operating" [nzValue]="cashFlow.operatingActivities" [nzValueStyle]="{'color': cashFlow.operatingActivities >= 0 ? '#52c41a' : '#ff4d4f'}" nzPrefix="₹" ></nz-statistic>
              </div>
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Investing" [nzValue]="cashFlow.investingActivities" [nzValueStyle]="{'color': cashFlow.investingActivities >= 0 ? '#52c41a' : '#ff4d4f'}" nzPrefix="₹" ></nz-statistic>
              </div>
              <div nz-col [nzSpan]="8">
                <nz-statistic nzTitle="Net Cash Flow" [nzValue]="cashFlow.netCashFlow" [nzValueStyle]="{'color': cashFlow.netCashFlow >= 0 ? '#52c41a' : '#ff4d4f'}" nzPrefix="₹" ></nz-statistic>
              </div>
            </div>
          </div>
        </nz-tab>

      </nz-tabset>
    </nz-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .header-left h2 { margin:0; font-size:24px; font-weight:600; }
    .header-left p { margin:4px 0 0; color:rgba(0,0,0,.45); }
    .date-range { display:flex; align-items:center; }
    .loading { display:flex; justify-content:center; padding:40px; }
  `]
})
export class FinancialReportsComponent implements OnInit {
  activeTab = 0;
  dateRange: Date[] = [new Date(new Date().getFullYear(), 0, 1), new Date()];
  trialBalance: any = null;
  profitLoss: any = null;
  balanceSheet: any = null;
  cashFlow: any = null;
  loadingTB = false;
  loadingPL = false;
  loadingBS = false;
  loadingCF = false;

  constructor(private service: AccountingService) {}

  ngOnInit() {}

  get fromDate(): string { return this.dateRange?.[0]?.toISOString().split('T')[0] ?? ''; }
  get toDate(): string { return this.dateRange?.[1]?.toISOString().split('T')[0] ?? ''; }

  onDateChange(range: Date[]) { this.dateRange = range; }

  onTabChange(e: any) { this.activeTab = e.index; }

  loadCurrentTab() {
    const tabs = [this.loadTrialBalance, this.loadProfitLoss, this.loadBalanceSheet, this.loadCashFlow];
    tabs[this.activeTab]?.call(this);
  }

  loadTrialBalance() {
    this.loadingTB = true;
    this.service.getTrialBalance({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res: any) => { this.trialBalance = res.data ?? res; this.loadingTB = false; },
      error: () => { this.loadingTB = false; }
    });
  }

  loadProfitLoss() {
    this.loadingPL = true;
    this.service.getProfitAndLoss({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res: any) => { this.profitLoss = res.data ?? res; this.loadingPL = false; },
      error: () => { this.loadingPL = false; }
    });
  }

  loadBalanceSheet() {
    this.loadingBS = true;
    this.service.getBalanceSheet({ asOfDate: this.toDate }).subscribe({
      next: (res: any) => { this.balanceSheet = res.data ?? res; this.loadingBS = false; },
      error: () => { this.loadingBS = false; }
    });
  }

  loadCashFlow() {
    this.loadingCF = true;
    this.service.getCashFlow({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res: any) => { this.cashFlow = res.data ?? res; this.loadingCF = false; },
      error: () => { this.loadingCF = false; }
    });
  }
}
