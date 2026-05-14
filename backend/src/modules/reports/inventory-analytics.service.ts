import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getStockAgeing(tenantId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { product: { tenantId, isActive: true }, quantity: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const productIds = [...new Set(stocks.map(s => s.productId))];
    const lastMovements = await this.prisma.stockMovement.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['productId'],
      select: { productId: true, createdAt: true },
    });
    const movementMap = new Map(lastMovements.map(m => [m.productId, m.createdAt]));

    const now = Date.now();
    return stocks.map(s => {
      const lastMovement = movementMap.get(s.productId);
      const daysInStock = lastMovement
        ? Math.floor((now - lastMovement.getTime()) / 86400000)
        : 999;
      return {
        product: s.product,
        warehouse: s.warehouse,
        quantity: s.quantity,
        value: s.quantity * Number(s.product?.costPrice ?? 0),
        lastMovement: lastMovement ?? null,
        daysInStock,
        ageingBucket:
          daysInStock <= 30 ? '0-30 days'
          : daysInStock <= 60 ? '31-60 days'
          : daysInStock <= 90 ? '61-90 days'
          : '90+ days',
      };
    });
  }

  async getDeadStock(tenantId: string, daysSinceLastMovement: number = 90) {
    const cutoffDate = new Date(Date.now() - daysSinceLastMovement * 86400000);

    const stocks = await this.prisma.stock.findMany({
      where: { product: { tenantId, isActive: true }, quantity: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true } },
        warehouse: { select: { name: true } },
      },
    });

    const productIds = [...new Set(stocks.map(s => s.productId))];
    const lastMovements = await this.prisma.stockMovement.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['productId'],
      select: { productId: true, createdAt: true },
    });
    const movementMap = new Map(lastMovements.map(m => [m.productId, m.createdAt]));

    return stocks
      .filter(s => {
        const lastMov = movementMap.get(s.productId);
        return !lastMov || lastMov < cutoffDate;
      })
      .map(s => {
        const lastMov = movementMap.get(s.productId);
        return {
          product: s.product,
          warehouse: s.warehouse,
          quantity: s.quantity,
          value: s.quantity * Number(s.product?.costPrice ?? 0),
          lastMovement: lastMov ?? null,
          daysSinceMovement: lastMov
            ? Math.floor((Date.now() - lastMov.getTime()) / 86400000)
            : 999,
        };
      });
  }

  async getReorderSuggestions(tenantId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { product: { tenantId, isActive: true, reorderLevel: { not: null } } },
      include: {
        product: {
          select: { id: true, name: true, sku: true, reorderLevel: true, maxStockLevel: true, costPrice: true },
        },
        warehouse: { select: { name: true } },
      },
    });

    return stocks
      .filter(s => s.product?.reorderLevel != null && s.quantity <= (s.product.reorderLevel ?? 0))
      .map(s => {
        const suggestedQty = Math.max(0, (s.product?.maxStockLevel ?? 0) - s.quantity);
        return {
          product: s.product,
          warehouse: s.warehouse,
          currentStock: s.quantity,
          reorderLevel: s.product?.reorderLevel,
          suggestedOrderQty: suggestedQty,
          estimatedCost: suggestedQty * Number(s.product?.costPrice ?? 0),
        };
      });
  }

  async getBatchExpiryReport(tenantId: string, daysUntilExpiry: number = 30) {
    const cutoffDate = new Date(Date.now() + daysUntilExpiry * 86400000);

    const batches = await this.prisma.batch.findMany({
      where: {
        expiryDate: { lte: cutoffDate, gte: new Date() },
        quantity: { gt: 0 },
        stock: { product: { tenantId, isActive: true } },
      },
      include: {
        stock: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            warehouse: { select: { name: true } },
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return batches.map(b => ({
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      quantity: b.quantity,
      daysUntilExpiry: b.expiryDate
        ? Math.floor((b.expiryDate.getTime() - Date.now()) / 86400000)
        : null,
      product: b.stock.product,
      warehouse: b.stock.warehouse,
    }));
  }

  async getWarehouseWiseStock(tenantId: string) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, code: true },
    });

    return Promise.all(
      warehouses.map(async wh => {
        const stocks = await this.prisma.stock.findMany({
          where: { warehouseId: wh.id, product: { tenantId, isActive: true } },
          include: { product: { select: { costPrice: true } } },
        });

        return {
          warehouse: wh,
          totalItems: stocks.length,
          totalQuantity: stocks.reduce((s, st) => s + st.quantity, 0),
          totalCostValue: stocks.reduce(
            (s, st) => s + st.quantity * Number(st.product?.costPrice ?? 0),
            0,
          ),
        };
      }),
    );
  }

  async getStockTurnoverRatio(tenantId: string, fromDate: Date, toDate: Date) {
    const [salesItems, stocks] = await Promise.all([
      this.prisma.salesOrderItem.findMany({
        where: { salesOrder: { tenantId, orderDate: { gte: fromDate, lte: toDate }, status: { not: 'CANCELLED' as any } } },
        include: { product: { select: { costPrice: true } } },
      }),
      this.prisma.stock.findMany({
        where: { product: { tenantId, isActive: true } },
        include: { product: { select: { costPrice: true } } },
      }),
    ]);

    const cogs = salesItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product?.costPrice ?? 0),
      0,
    );
    const inventoryValue = stocks.reduce(
      (sum, s) => sum + s.quantity * Number(s.product?.costPrice ?? 0),
      0,
    );

    const ratio = inventoryValue > 0 ? cogs / inventoryValue : 0;
    const days = Math.abs(toDate.getTime() - fromDate.getTime()) / 86400000;
    const turnoverDays = ratio > 0 ? Math.round(days / ratio) : 0;

    return { cogs, avgInventoryValue: inventoryValue, ratio: Math.round(ratio * 100) / 100, turnoverDays };
  }
}
