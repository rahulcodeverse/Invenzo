import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  async getSummaryKpis(tenantId: string) {
    const [revenueResult, receivablesResult, payablesResult, totalProducts, stocks] =
      await Promise.all([
        this.prisma.salesInvoice.aggregate({
          where: { tenantId },
          _sum: { total: true },
        }),
        this.prisma.salesInvoice.aggregate({
          where: {
            tenantId,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
          },
          _sum: { balanceAmount: true },
        }),
        this.prisma.purchaseInvoice.aggregate({
          where: {
            tenantId,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
          },
          _sum: { balanceAmount: true },
        }),
        this.prisma.product.count({ where: { tenantId, isActive: true } }),
        this.prisma.stock.findMany({
          where: { product: { tenantId, isActive: true, reorderLevel: { not: null } } },
          include: { product: { select: { reorderLevel: true } } },
        }),
      ]);

    const lowStockCount = stocks.filter(
      s => s.product?.reorderLevel != null && s.quantity <= (s.product.reorderLevel ?? 0),
    ).length;

    const revenue = Number(revenueResult._sum.total ?? 0);
    const expenses = await this.prisma.purchaseInvoice.aggregate({
      where: { tenantId },
      _sum: { total: true },
    });

    return {
      revenue,
      profit: revenue - Number(expenses._sum.total ?? 0),
      receivables: Number(receivablesResult._sum.balanceAmount ?? 0),
      payables: Number(payablesResult._sum.balanceAmount ?? 0),
      totalProducts,
      lowStockCount,
    };
  }

  async getFinanceKpis(tenantId: string, fromDate: Date, toDate: Date) {
    const [revenueResult, expensesResult, receivablesResult, payablesResult] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: { tenantId, invoiceDate: { gte: fromDate, lte: toDate } },
        _sum: { total: true },
      }),
      this.prisma.purchaseInvoice.aggregate({
        where: { tenantId, invoiceDate: { gte: fromDate, lte: toDate } },
        _sum: { total: true },
      }),
      this.prisma.salesInvoice.aggregate({
        where: {
          tenantId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.purchaseInvoice.aggregate({
        where: {
          tenantId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
        },
        _sum: { balanceAmount: true },
      }),
    ]);

    const revenue = Number(revenueResult._sum.total ?? 0);
    const expenses = Number(expensesResult._sum.total ?? 0);

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      receivables: Number(receivablesResult._sum.balanceAmount ?? 0),
      payables: Number(payablesResult._sum.balanceAmount ?? 0),
    };
  }

  async getFinancialKpis(tenantId: string) {
    const now = new Date();
    return this.getFinanceKpis(tenantId, new Date(now.getFullYear(), 0, 1), now);
  }

  async getInventoryKpis(tenantId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { product: { tenantId, isActive: true } },
      include: { product: { select: { costPrice: true, reorderLevel: true } } },
    });

    const totalValue = stocks.reduce(
      (sum, s) => sum + s.quantity * Number(s.product?.costPrice ?? 0),
      0,
    );
    const lowStockCount = stocks.filter(
      s => s.product?.reorderLevel != null && s.quantity <= (s.product.reorderLevel ?? 0),
    ).length;
    const deadStockCount = stocks.filter(s => s.quantity === 0).length;

    return { totalValue, lowStockCount, deadStockCount };
  }

  async getTopProducts(tenantId: string, limit: number = 10) {
    const items = await this.prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: { salesOrder: { tenantId } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    if (!items.length) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    return items.map(i => ({
      product: productMap.get(i.productId),
      quantitySold: i._sum.quantity ?? 0,
      revenue: Number(i._sum.total ?? 0),
    }));
  }

  async getTopCustomers(tenantId: string, limit: number = 10) {
    const result = await this.prisma.salesInvoice.groupBy({
      by: ['customerId'],
      where: { tenantId },
      _sum: { total: true, paidAmount: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    if (!result.length) return [];

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: result.map(r => r.customerId) } },
      select: { id: true, name: true, code: true, phone: true },
    });
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return result.map(r => ({
      customer: customerMap.get(r.customerId),
      totalRevenue: Number(r._sum.total ?? 0),
      totalPaid: Number(r._sum.paidAmount ?? 0),
      invoiceCount: r._count.id,
    }));
  }

  async getTopVendors(tenantId: string, limit: number = 10) {
    const result = await this.prisma.purchaseInvoice.groupBy({
      by: ['vendorId'],
      where: { tenantId },
      _sum: { total: true, paidAmount: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    if (!result.length) return [];

    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: result.map(r => r.vendorId) } },
      select: { id: true, name: true, code: true, phone: true },
    });
    const vendorMap = new Map(vendors.map(v => [v.id, v]));

    return result.map(r => ({
      vendor: vendorMap.get(r.vendorId),
      totalPurchase: Number(r._sum.total ?? 0),
      totalPaid: Number(r._sum.paidAmount ?? 0),
      invoiceCount: r._count.id,
    }));
  }
}
