import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type GstRegisterRow = {
  documentNumber: string;
  documentDate: Date;
  partyName: string;
  gstNumber: string | null;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  status: string;
};

@Injectable()
export class GstReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, fromDate: Date, toDate: Date) {
    const [salesInvoices, purchaseInvoices] = await Promise.all([
      this.getSalesInvoices(tenantId, fromDate, toDate),
      this.getPurchaseInvoices(tenantId, fromDate, toDate),
    ]);

    const outputTax = this.sum(salesInvoices, invoice => Number(invoice.taxAmount));
    const inputTax = this.sum(purchaseInvoices, invoice => Number(invoice.taxAmount));
    const taxableSales = this.sum(salesInvoices, invoice => Number(invoice.subtotal) - Number(invoice.discount));
    const taxablePurchases = this.sum(purchaseInvoices, invoice => Number(invoice.subtotal) - Number(invoice.discount));
    const salesTotal = this.sum(salesInvoices, invoice => Number(invoice.total));
    const purchaseTotal = this.sum(purchaseInvoices, invoice => Number(invoice.total));

    return {
      period: {
        fromDate,
        toDate,
      },
      sales: {
        invoices: salesInvoices.length,
        taxableAmount: taxableSales,
        outputTax,
        cgst: outputTax / 2,
        sgst: outputTax / 2,
        igst: 0,
        totalAmount: salesTotal,
      },
      purchases: {
        invoices: purchaseInvoices.length,
        taxableAmount: taxablePurchases,
        inputTax,
        cgst: inputTax / 2,
        sgst: inputTax / 2,
        igst: 0,
        totalAmount: purchaseTotal,
      },
      payable: {
        outputTax,
        inputTax,
        netTaxPayable: outputTax - inputTax,
      },
    };
  }

  async getGstr1(tenantId: string, fromDate: Date, toDate: Date) {
    const invoices = await this.getSalesInvoices(tenantId, fromDate, toDate);

    const rows = invoices.map(invoice => {
      const customer = invoice.salesOrder.customer;
      return this.toRegisterRow({
        documentNumber: invoice.invoiceNumber,
        documentDate: invoice.invoiceDate,
        partyName: customer.name,
        gstNumber: customer.gstNumber,
        taxableAmount: Number(invoice.subtotal) - Number(invoice.discount),
        totalTax: Number(invoice.taxAmount),
        totalAmount: Number(invoice.total),
        status: invoice.status,
      });
    });

    return {
      rows,
      totals: this.getRegisterTotals(rows),
    };
  }

  async getGstr2(tenantId: string, fromDate: Date, toDate: Date) {
    const invoices = await this.getPurchaseInvoices(tenantId, fromDate, toDate);
    const vendors = await this.prisma.vendor.findMany({
      where: {
        tenantId,
        id: { in: [...new Set(invoices.map(invoice => invoice.vendorId))] },
      },
    });
    const vendorMap = new Map(vendors.map(vendor => [vendor.id, vendor]));

    const rows = invoices.map(invoice => {
      const vendor = vendorMap.get(invoice.vendorId);
      return this.toRegisterRow({
        documentNumber: invoice.invoiceNumber,
        documentDate: invoice.invoiceDate,
        partyName: vendor?.name ?? invoice.vendorId,
        gstNumber: vendor?.gstNumber ?? null,
        taxableAmount: Number(invoice.subtotal) - Number(invoice.discount),
        totalTax: Number(invoice.taxAmount),
        totalAmount: Number(invoice.total),
        status: invoice.status,
      });
    });

    return {
      rows,
      totals: this.getRegisterTotals(rows),
    };
  }

  private getSalesInvoices(tenantId: string, fromDate: Date, toDate: Date) {
    return this.prisma.salesInvoice.findMany({
      where: {
        tenantId,
        invoiceDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { invoiceDate: 'asc' },
    });
  }

  private getPurchaseInvoices(tenantId: string, fromDate: Date, toDate: Date) {
    return this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        invoiceDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { invoiceDate: 'asc' },
    });
  }

  private toRegisterRow(row: Omit<GstRegisterRow, 'cgst' | 'sgst' | 'igst'>): GstRegisterRow {
    return {
      ...row,
      cgst: row.totalTax / 2,
      sgst: row.totalTax / 2,
      igst: 0,
    };
  }

  private getRegisterTotals(rows: GstRegisterRow[]) {
    return {
      taxableAmount: this.sum(rows, row => row.taxableAmount),
      cgst: this.sum(rows, row => row.cgst),
      sgst: this.sum(rows, row => row.sgst),
      igst: this.sum(rows, row => row.igst),
      totalTax: this.sum(rows, row => row.totalTax),
      totalAmount: this.sum(rows, row => row.totalAmount),
    };
  }

  private sum<T>(items: T[], selector: (item: T) => number) {
    return items.reduce((total, item) => total + selector(item), 0);
  }
}
