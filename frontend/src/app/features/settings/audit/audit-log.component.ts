import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { debounceTime, Subject } from 'rxjs';
import { AuditLog, AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, NzButtonModule, NzCardModule, NzIconModule, NzInputModule, NzTableModule, NzTagModule],
  template: `
    <nz-card>
      <div class="page-header">
        <div class="header-left">
          <h2>Audit Trail</h2>
          <p>Track important operational and financial actions</p>
        </div>
        <nz-input-group nzSearch [nzAddOnAfter]="searchButton" style="width: 300px;">
          <input nz-input placeholder="Search action or entity..." [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" />
        </nz-input-group>
        <ng-template #searchButton>
          <button nz-button nzType="primary" nzSearch>
            <span nz-icon nzType="search"></span>
          </button>
        </ng-template>
      </div>

      <nz-table
        #table
        [nzData]="logs"
        [nzLoading]="loading"
        [nzTotal]="total"
        [nzPageSize]="pageSize"
        [nzPageIndex]="pageIndex"
        [nzFrontPagination]="false"
        (nzPageIndexChange)="onPageChange($event)"
      >
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Reference</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of table.data">
            <td>{{ log.createdAt | date:'dd MMM yyyy, h:mm a' }}</td>
            <td>
              <strong>{{ getUserName(log) }}</strong>
              <div class="muted">{{ log.user?.role || '-' }}</div>
            </td>
            <td><nz-tag [nzColor]="getActionColor(log.action)">{{ log.action }}</nz-tag></td>
            <td>{{ log.entity }}</td>
            <td class="mono">{{ log.entityId || '-' }}</td>
            <td>{{ summarize(log) }}</td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>
  `,
  styles: [`
    .page-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .header-left h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .header-left p,
    .muted {
      margin: 4px 0 0;
      color: var(--invenzo-muted);
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      color: #6f675f;
    }
  `]
})
export class AuditLogComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = false;
  total = 0;
  pageIndex = 1;
  pageSize = 50;
  searchText = '';
  private readonly search$ = new Subject<string>();

  constructor(private readonly auditService: AuditService) {
    this.search$.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex = 1;
      this.loadLogs();
    });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditService.getLogs({
      page: this.pageIndex,
      limit: this.pageSize,
      search: this.searchText || undefined,
    }).subscribe({
      next: res => {
        this.logs = res.data;
        this.total = res.meta.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadLogs();
  }

  getUserName(log: AuditLog): string {
    if (!log.user) return 'System';
    return `${log.user.firstName} ${log.user.lastName}`;
  }

  getActionColor(action: string): string {
    return {
      CREATE: 'gold',
      UPDATE: 'blue',
      APPROVE: 'green',
      CONFIRM: 'green',
      CANCEL: 'red',
    }[action] ?? 'default';
  }

  summarize(log: AuditLog): string {
    const changes = log.changes || {};
    const ref = changes['invoiceNumber'] || changes['paymentNumber'] || changes['poNumber'] || changes['soNumber'] || changes['grnNumber'] || changes['deliveryNumber'];
    const amount = changes['total'] ?? changes['amount'];
    return [ref, amount !== undefined ? `Amount: ${Number(amount).toLocaleString()}` : null]
      .filter(Boolean)
      .join(' | ') || '-';
  }
}
