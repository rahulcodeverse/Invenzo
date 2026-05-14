import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSalesTrend(tenantId: string, fromDate?: Date, toDate?: Date, groupBy?: string) {
    const from = fromDate ?? new Date(new Date().getFullYear(), 0, 1);
    const to = toDate ?? new Date();

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { tenantId, invoiceDate: { gte: from, lte: to } },
      select: { invoiceDate: true, total: true },
      orderBy: { invoiceDate: 'asc' },
    });

    const grouped = new Map<string, number>();
    for (const inv of invoices) {
      const key = this.getDateKey(inv.invoiceDate, groupBy ?? 'day');
      grouped.set(key, (grouped.get(key) ?? 0) + Number(inv.total));
    }

    const trend = Array.from(grouped.entries()).map(([date, total]) => ({ date, total }));
    const total = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    return { trend, total };
  }

  private getDateKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    if (groupBy === 'month') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (groupBy === 'week') {
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      return startOfWeek.toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
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

  async getProductWiseSales(tenantId: string, fromDate: Date, toDate: Date, limit: number = 50) {
    const items = await this.prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: { salesOrder: { tenantId, orderDate: { gte: fromDate, lte: toDate } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    if (!items.length) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, name: true, sku: true, category: { select: { name: true } } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    return items.map(i => ({
      product: productMap.get(i.productId),
      quantitySold: i._sum.quantity ?? 0,
      revenue: Number(i._sum.total ?? 0),
    }));
  }

  async getCategoryWiseSales(tenantId: string, fromDate: Date, toDate: Date) {
    const items = await this.prisma.salesOrderItem.findMany({
      where: { salesOrder: { tenantId, orderDate: { gte: fromDate, lte: toDate } } },
      select: {
        total: true,
        quantity: true,
        product: { select: { category: { select: { id: true, name: true } } } },
      },
    });

    const categoryMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    for (const item of items) {
      const category = item.product?.category;
      if (!category) continue;
      const existing = categoryMap.get(category.id) ?? { name: category.name, revenue: 0, quantity: 0 };
      existing.revenue += Number(item.total);
      existing.quantity += item.quantity;
      categoryMap.set(category.id, existing);
    }

    return Array.from(categoryMap.entries())
      .map(([id, data]) => ({ categoryId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getCustomerWiseSales(tenantId: string, fromDate: Date, toDate: Date, limit: number = 50) {
    const result = await this.prisma.salesInvoice.groupBy({
      by: ['customerId'],
      where: { tenantId, invoiceDate: { gte: fromDate, lte: toDate } },
      _sum: { total: true, paidAmount: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    if (!result.length) return [];

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: result.map(r => r.customerId) } },
      select: { id: true, name: true, code: true },
    });
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return result.map(r => ({
      customer: customerMap.get(r.customerId),
      revenue: Number(r._sum.total ?? 0),
      paid: Number(r._sum.paidAmount ?? 0),
      invoiceCount: r._count.id,
    }));
  }

  async getSalesGrowth(tenantId: string) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentResult, lastResult] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: { tenantId, invoiceDate: { gte: startOfThisMonth, lte: now } },
        _sum: { total: true },
      }),
      this.prisma.salesInvoice.aggregate({
        where: { tenantId, invoiceDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
    ]);

    const current = Number(currentResult._sum.total ?? 0);
    const last = Number(lastResult._sum.total ?? 0);
    const growthPercent = last === 0 ? (current > 0 ? 100 : 0) : ((current - last) / last) * 100;

    return {
      currentMonth: current,
      lastMonth: last,
      growthPercent: Math.round(growthPercent * 100) / 100,
    };
  }
}
