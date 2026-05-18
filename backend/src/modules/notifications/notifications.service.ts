import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { PrismaService } from '../../prisma/prisma.service';

type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  data?: Record<string, any>;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
      },
    });
  }

  async createOrderUpdate(tenantId: string, title: string, message: string, data?: Record<string, any>) {
    return this.create(tenantId, {
      type: NotificationType.ORDER_UPDATE,
      title,
      message,
      data,
    });
  }

  async createPaymentReminder(tenantId: string, title: string, message: string, data?: Record<string, any>) {
    return this.create(tenantId, {
      type: NotificationType.PAYMENT_REMINDER,
      title,
      message,
      data,
    });
  }

  async createLowStockAlerts(tenantId: string, productIds: string[]) {
    const uniqueProductIds = [...new Set(productIds)];
    if (!uniqueProductIds.length) return [];

    const stocks = await this.prisma.stock.findMany({
      where: {
        productId: { in: uniqueProductIds },
        product: { tenantId },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            minStockLevel: true,
            reorderLevel: true,
          },
        },
      },
    });

    const created: Awaited<ReturnType<NotificationsService['create']>>[] = [];
    for (const stock of stocks) {
      const threshold = stock.product.reorderLevel || stock.product.minStockLevel || 0;
      if (threshold <= 0 || stock.available > threshold) continue;

      const title = `Low stock: ${stock.product.name}`;
      const existing = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          type: NotificationType.LOW_STOCK,
          isRead: false,
          title,
        },
      });

      if (existing) continue;

      created.push(await this.create(tenantId, {
        type: NotificationType.LOW_STOCK,
        title,
        message: `${stock.product.sku} has ${stock.available} units available in ${stock.warehouse.name}. Reorder level is ${threshold}.`,
        data: {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
          available: stock.available,
          threshold,
        },
      }));
    }

    return created;
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where = { tenantId };
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return PaginationHelper.paginate(notifications, total, page, limit);
  }

  async getUnreadCount(tenantId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, isRead: false },
    });

    return { count };
  }

  async markRead(id: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { id, tenantId },
      data: { isRead: true },
    });
  }

  async markAllRead(tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { tenantId, isRead: false },
      data: { isRead: true },
    });
  }
}
