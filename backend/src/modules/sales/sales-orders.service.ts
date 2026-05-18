import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalesOrderDto, UpdateSalesOrderDto } from './dto/quotation-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { SkuGenerator } from '../../common/utils/sku-generator.helper';
import { OrderStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(tenantId: string, userId: string, createSoDto: CreateSalesOrderDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: createSoDto.customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check credit limit if order has value
    let canProceed = true;
    if (Number(customer.creditLimit) > 0) {
      const outstandingAmount = await this.getCustomerOutstanding(createSoDto.customerId);
      // Note: In production, you'd check if outstanding + new order exceeds credit limit
    }

    // If quotation provided, verify it exists
    if (createSoDto.quotationId) {
      const quotation = await this.prisma.quotation.findFirst({
        where: {
          id: createSoDto.quotationId,
          tenantId,
          customerId: createSoDto.customerId,
        },
      });

      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }

      if (!quotation.convertedToSO) {
        throw new BadRequestException('Quotation must be converted to SO first');
      }
    }

    // Verify all products exist and have stock
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: createSoDto.items.map(item => item.productId) },
        tenantId,
      },
      include: {
        stocks: {
          select: {
            available: true,
          },
        },
      },
    });

    if (products.length !== createSoDto.items.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Generate SO number
    const count = await this.prisma.salesOrder.count({ where: { tenantId } });
    const soNumber = SkuGenerator.generateSoNumber(count + 1);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsWithCalculations = createSoDto.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTax = ((itemSubtotal - itemDiscount) * (item.taxRate || 0)) / 100;
      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        taxAmount: itemTax,
        discount: itemDiscount,
        total: itemTotal,
      };
    });

    const discount = createSoDto.discount || 0;
    const total = subtotal + taxAmount - discount;

    // Create SO with items in transaction
    const salesOrder = await this.prisma.$transaction(async tx => {
      const salesOrder = await tx.salesOrder.create({
        data: {
          tenantId,
          soNumber,
          customerId: createSoDto.customerId,
          quotationId: createSoDto.quotationId,
          deliveryDate: createSoDto.deliveryDate ? new Date(createSoDto.deliveryDate) : null,
          subtotal,
          taxAmount,
          discount,
          total,
          notes: createSoDto.notes,
          createdBy: userId,
          items: {
            create: itemsWithCalculations,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  unit: {
                    select: {
                      symbol: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return salesOrder;
    });

    await this.auditService.record(tenantId, userId, {
      action: 'CREATE',
      entity: 'SalesOrder',
      entityId: salesOrder.id,
      changes: {
        soNumber: salesOrder.soNumber,
        customerId: salesOrder.customerId,
        total: Number(salesOrder.total),
      },
    });

    return salesOrder;
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if ((paginationDto as any).customerId) {
      where.customerId = (paginationDto as any).customerId;
    }

    if ((paginationDto as any).status) {
      where.status = (paginationDto as any).status;
    }

    if (search) {
      where.OR = [
        { soNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [salesOrders, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              items: true,
              deliveryNotes: true,
            },
          },
        },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return PaginationHelper.paginate(salesOrders, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: {
                  select: {
                    name: true,
                    symbol: true,
                  },
                },
              },
            },
          },
        },
        deliveryNotes: {
          select: {
            id: true,
            deliveryNumber: true,
            deliveryDate: true,
            items: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException('Sales order not found');
    }

    return salesOrder;
  }

  async update(id: string, tenantId: string, updateSoDto: UpdateSalesOrderDto, userId?: string) {
    const existing = await this.findOne(id, tenantId);

    // Check if SO can be updated
    if (existing.status === OrderStatus.COMPLETED || existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update ${existing.status} sales order`);
    }

    // If items are being updated, recalculate totals
    if (updateSoDto.items) {
      let subtotal = 0;
      let taxAmount = 0;

      const itemsWithCalculations = updateSoDto.items.map(item => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discount || 0;
        const itemTax = ((itemSubtotal - itemDiscount) * (item.taxRate || 0)) / 100;
        const itemTotal = itemSubtotal - itemDiscount + itemTax;

        subtotal += itemSubtotal;
        taxAmount += itemTax;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          taxAmount: itemTax,
          discount: itemDiscount,
          total: itemTotal,
        };
      });

      const discount = updateSoDto.discount !== undefined ? updateSoDto.discount : existing.discount;
      const total = subtotal + taxAmount - Number(discount);

      const updated = await this.prisma.$transaction(async tx => {
        // Delete existing items
        await tx.salesOrderItem.deleteMany({
          where: { salesOrderId: id },
        });

        // Create new items
        return tx.salesOrder.update({
          where: { id },
          data: {
            customerId: updateSoDto.customerId,
            deliveryDate: updateSoDto.deliveryDate ? new Date(updateSoDto.deliveryDate) : undefined,
            subtotal,
            taxAmount,
            discount,
            total,
            notes: updateSoDto.notes,
            status: updateSoDto.status,
            items: {
              create: itemsWithCalculations,
            },
          },
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        });
      });

      if (userId) {
        await this.auditService.record(tenantId, userId, {
          action: 'UPDATE',
          entity: 'SalesOrder',
          entityId: id,
          changes: { beforeStatus: existing.status, afterStatus: updated.status },
        });
      }

      return updated;
    }

    // Simple update without items
    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        customerId: updateSoDto.customerId,
        deliveryDate: updateSoDto.deliveryDate ? new Date(updateSoDto.deliveryDate) : undefined,
        discount: updateSoDto.discount,
        notes: updateSoDto.notes,
        status: updateSoDto.status,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (userId) {
      await this.auditService.record(tenantId, userId, {
        action: 'UPDATE',
        entity: 'SalesOrder',
        entityId: id,
        changes: { beforeStatus: existing.status, afterStatus: updated.status },
      });
    }

    return updated;
  }

  async confirm(id: string, tenantId: string, userId?: string) {
    const so = await this.findOne(id, tenantId);

    if (so.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only draft sales orders can be confirmed');
    }

    // Check stock availability for all items
    for (const item of so.items) {
      const totalAvailable = await this.prisma.stock.aggregate({
        where: {
          productId: item.productId,
        },
        _sum: {
          available: true,
        },
      });

      if (!totalAvailable._sum.available || totalAvailable._sum.available < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}. Available: ${totalAvailable._sum.available || 0}, Required: ${item.quantity}`,
        );
      }
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: OrderStatus.CONFIRMED,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (userId) {
      await this.auditService.record(tenantId, userId, {
        action: 'CONFIRM',
        entity: 'SalesOrder',
        entityId: id,
        changes: { beforeStatus: so.status, afterStatus: updated.status },
      });
    }

    return updated;
  }

  async cancel(id: string, tenantId: string, userId?: string) {
    const so = await this.findOne(id, tenantId);

    if (so.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed sales order');
    }

    // Check if any delivery exists
    if (so.deliveryNotes && so.deliveryNotes.length > 0) {
      throw new BadRequestException('Cannot cancel sales order with deliveries');
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    if (userId) {
      await this.auditService.record(tenantId, userId, {
        action: 'CANCEL',
        entity: 'SalesOrder',
        entityId: id,
        changes: { beforeStatus: so.status, afterStatus: updated.status },
      });
    }

    return updated;
  }

  async remove(id: string, tenantId: string) {
    const so = await this.findOne(id, tenantId);

    if (so.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only draft sales orders can be deleted');
    }

    if (so.deliveryNotes && so.deliveryNotes.length > 0) {
      throw new BadRequestException('Cannot delete sales order with deliveries');
    }

    await this.prisma.salesOrder.delete({
      where: { id },
    });

    return { message: 'Sales order deleted successfully' };
  }

  // Get pending SOs (not fully delivered)
  async getPendingSos(tenantId: string) {
    const sos = await this.prisma.salesOrder.findMany({
      where: {
        tenantId,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            productId: true,
            quantity: true,
            deliveredQty: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    // Filter SOs where not all items are delivered
    return sos
      .filter(so => so.items.some(item => item.deliveredQty < item.quantity))
      .map(so => ({
        id: so.id,
        soNumber: so.soNumber,
        customer: so.customer.name,
        orderDate: so.orderDate,
        total: so.total,
        items: so.items.map(item => ({
          product: item.product.name,
          sku: item.product.sku,
          ordered: item.quantity,
          delivered: item.deliveredQty,
          pending: item.quantity - item.deliveredQty,
        })),
      }));
  }

  private async getCustomerOutstanding(customerId: string): Promise<number> {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        customerId,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      select: {
        balanceAmount: true,
      },
    });

    return invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
  }
}

