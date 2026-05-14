import { Injectable } from '@angular/core';
import { StockMovement, MovementExportData, MOVEMENT_TYPE_CONFIG } from '../models/movement.model';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class MovementExportService {

  /**
   * Convert movements to CSV format
   */
  convertToCSV(movements: StockMovement[]): string {
    const headers = [
      'Date & Time',
      'Product',
      'SKU',
      'Warehouse',
      'Type',
      'Quantity',
      'Reference',
      'User',
      'Notes'
    ];

    const rows = movements.map(m => [
      this.formatDate(m.createdAt),
      m.product?.name || '-',
      m.product?.sku || '-',
      m.warehouse?.name || '-',
      MOVEMENT_TYPE_CONFIG[m.type]?.label || m.type,
      this.formatQuantity(m.quantity),
      m.reference || '-',
      this.formatUser(m.user),
      m.notes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSV(cell)).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCSV(movements: StockMovement[], filename?: string): void {
    const csv = this.convertToCSV(movements);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    const fileName = filename || `inventory-movements-${this.getTimestamp()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Download Excel file (from blob response)
   */
  downloadExcel(blob: Blob, filename?: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = filename || `inventory-movements-${this.getTimestamp()}.xlsx`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Print movements table
   */
  printMovements(movements: StockMovement[]): void {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const html = this.generatePrintHTML(movements);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  /**
   * Generate HTML for printing
   */
  private generatePrintHTML(movements: StockMovement[]): string {
    const rows = movements.map(m => `
      <tr>
        <td>${this.formatDate(m.createdAt)}</td>
        <td>${m.product?.name || '-'}</td>
        <td>${m.warehouse?.name || '-'}</td>
        <td>${MOVEMENT_TYPE_CONFIG[m.type]?.label || m.type}</td>
        <td style="text-align: right">${this.formatQuantity(m.quantity)}</td>
        <td>${m.reference || '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Movements Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            .meta {
              color: #666;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .positive {
              color: #9a4f12;
            }
            .negative {
              color: #ff4d4f;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Inventory Movements Report</h1>
          <div class="meta">
            Generated on: ${this.formatDate(new Date().toISOString())}<br>
            Total Records: ${movements.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Helper: Format date
   */
  private formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  }

  /**
   * Helper: Format quantity with sign
   */
  private formatQuantity(quantity: number): string {
    return quantity >= 0 ? `+${quantity}` : quantity.toString();
  }

  /**
   * Helper: Format user name
   */
  private formatUser(user: any): string {
    if (!user) return '-';
    return user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email || '-';
  }

  /**
   * Helper: Escape CSV values
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Helper: Generate timestamp for filenames
   */
  private getTimestamp(): string {
    return format(new Date(), 'yyyyMMdd-HHmmss');
  }
}
