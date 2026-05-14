import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, PurchaseOrderQueryDto } from './dto/purchase-order.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { SkuGenerator } from '../../common/utils/sku-generator.helper';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, createPoDto: CreatePurchaseOrderDto) {
    // Verify vendor exists
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: createPoDto.vendorId, tenantId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Verify all products exist
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: createPoDto.items.map(item => item.productId) },
        tenantId,
      },
    });

    if (products.length !== createPoDto.items.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Generate PO number
    const count = await this.prisma.purchaseOrder.count({ where: { tenantId } });
    const poNumber = SkuGenerator.generatePoNumber(count + 1);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsWithCalculations = createPoDto.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = (itemSubtotal * (item.taxRate || 0)) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        taxAmount: itemTax,
        total: itemTotal,
      };
    });

    const discount = createPoDto.discount || 0;
    const total = subtotal + taxAmount - discount;

    // Create PO with items in transaction
    return this.prisma.$transaction(async tx => {
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          tenantId,
          poNumber,
          vendorId: createPoDto.vendorId,
          expectedDate: createPoDto.expectedDate ? new Date(createPoDto.expectedDate) : null,
          subtotal,
          taxAmount,
          discount,
          total,
          notes: createPoDto.notes,
          createdBy: userId,
          items: {
            create: itemsWithCalculations,
          },
        },
        include: {
          vendor: {
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

      return purchaseOrder;
    });
  }

  async findAll(tenantId: string, paginationDto: PurchaseOrderQueryDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', status, vendorId } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const [purchaseOrders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              items: true,
              grns: true,
            },
          },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return PaginationHelper.paginate(purchaseOrders, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        vendor: true,
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
        grns: {
          select: {
            id: true,
            grnNumber: true,
            receivedDate: true,
            items: true,
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

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async update(id: string, tenantId: string, updatePoDto: UpdatePurchaseOrderDto) {
    const existing = await this.findOne(id, tenantId);

    // Check if PO can be updated
    if (existing.status === OrderStatus.COMPLETED || existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update ${existing.status} purchase order`);
    }

    // If items are being updated, recalculate totals
    if (updatePoDto.items) {
      let subtotal = 0;
      let taxAmount = 0;

      const itemsWithCalculations = updatePoDto.items.map(item => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = (itemSubtotal * (item.taxRate || 0)) / 100;
        const itemTotal = itemSubtotal + itemTax;

        subtotal += itemSubtotal;
        taxAmount += itemTax;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          taxAmount: itemTax,
          total: itemTotal,
        };
      });

      const discount = updatePoDto.discount !== undefined ? updatePoDto.discount : existing.discount;
      const total = subtotal + taxAmount - Number(discount);

      return this.prisma.$transaction(async tx => {
        // Delete existing items
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        // Create new items
        return tx.purchaseOrder.update({
          where: { id },
          data: {
            vendorId: updatePoDto.vendorId,
            expectedDate: updatePoDto.expectedDate ? new Date(updatePoDto.expectedDate) : undefined,
            subtotal,
            taxAmount,
            discount,
            total,
            notes: updatePoDto.notes,
            status: updatePoDto.status,
            items: {
              create: itemsWithCalculations,
            },
          },
          include: {
            vendor: true,
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
    }

    // Simple update without items
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        vendorId: updatePoDto.vendorId,
        expectedDate: updatePoDto.expectedDate ? new Date(updatePoDto.expectedDate) : undefined,
        discount: updatePoDto.discount,
        notes: updatePoDto.notes,
        status: updatePoDto.status,
      },
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async approve(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);

    if (po.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only draft purchase orders can be approved');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: OrderStatus.CONFIRMED,
      },
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async cancel(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);

    if (po.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed purchase order');
    }

    // Check if any GRN exists
    if (po.grns && po.grns.length > 0) {
      throw new BadRequestException('Cannot cancel purchase order with goods received');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const po = await this.findOne(id, tenantId);

    if (po.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only draft purchase orders can be deleted');
    }

    if (po.grns && po.grns.length > 0) {
      throw new BadRequestException('Cannot delete purchase order with goods received');
    }

    await this.prisma.purchaseOrder.delete({
      where: { id },
    });

    return { message: 'Purchase order deleted successfully' };
  }

  // Get pending POs (not fully received)
  async getPendingPos(tenantId: string) {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
      },
      include: {
        vendor: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            productId: true,
            quantity: true,
            receivedQty: true,
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

    // Filter POs where not all items are received
    return pos.filter(po =>
      po.items.some(item => item.receivedQty < item.quantity),
    ).map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      vendor: po.vendor.name,
      orderDate: po.orderDate,
      total: po.total,
      items: po.items.map(item => ({
        product: item.product.name,
        sku: item.product.sku,
        ordered: item.quantity,
        received: item.receivedQty,
        pending: item.quantity - item.receivedQty,
      })),
    }));
  }
}

