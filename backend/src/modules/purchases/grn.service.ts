import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGrnDto } from './dto/grn-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { SkuGenerator } from '../../common/utils/sku-generator.helper';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus, MovementType } from '@prisma/client';

@Injectable()
export class GrnService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async create(tenantId: string, userId: string, createGrnDto: CreateGrnDto) {
    // Verify PO exists and belongs to tenant
    const po = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: createGrnDto.purchaseOrderId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        vendor: true,
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    // Check PO status
    if (po.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot receive goods for cancelled purchase order');
    }

    // Verify warehouse
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: createGrnDto.warehouseId,
        tenantId,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate GRN items against PO items
    for (const grnItem of createGrnDto.items) {
      const poItem = po.items.find(item => item.productId === grnItem.productId);

      if (!poItem) {
        throw new BadRequestException(
          `Product ${grnItem.productId} is not in purchase order`,
        );
      }

      const pendingQty = poItem.quantity - poItem.receivedQty;

      if (grnItem.quantity > pendingQty) {
        throw new BadRequestException(
          `Cannot receive ${grnItem.quantity} units of ${poItem.product.name}. ` +
          `Only ${pendingQty} units pending (Ordered: ${poItem.quantity}, ` +
          `Already received: ${poItem.receivedQty})`,
        );
      }
    }

    // Generate GRN number
    const count = await this.prisma.goodsReceivedNote.count();
    const grnNumber = SkuGenerator.generateGrnNumber(count + 1);

    // Create GRN and update stock in transaction
    return this.prisma.$transaction(async tx => {
      // Create GRN
      const grn = await tx.goodsReceivedNote.create({
        data: {
          grnNumber,
          purchaseOrderId: createGrnDto.purchaseOrderId,
          warehouseId: createGrnDto.warehouseId,
          receivedDate: createGrnDto.receivedDate
            ? new Date(createGrnDto.receivedDate)
            : new Date(),
          receivedBy: userId,
          notes: createGrnDto.notes,
          items: {
            create: createGrnDto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            })),
          },
        },
        include: {
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
          purchaseOrder: {
            select: {
              poNumber: true,
              vendor: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update received quantities in PO items
      for (const grnItem of createGrnDto.items) {
        const poItem = po.items.find(item => item.productId === grnItem.productId);

        await tx.purchaseOrderItem.update({
          where: { id: poItem!.id },
          data: {
            receivedQty: poItem!.receivedQty + grnItem.quantity,
          },
        });

        // Create stock movement and update stock
        const product = poItem!.product;

        // Get or create stock record
        let stock = await tx.stock.findUnique({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: createGrnDto.warehouseId,
            },
          },
        });

        if (!stock) {
          stock = await tx.stock.create({
            data: {
              productId: product.id,
              warehouseId: createGrnDto.warehouseId,
              quantity: 0,
              reserved: 0,
              available: 0,
            },
          });
        }

        // Update stock quantities
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: stock.quantity + grnItem.quantity,
            available: stock.available + grnItem.quantity,
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            warehouseId: createGrnDto.warehouseId,
            productId: product.id,
            type: MovementType.IN,
            quantity: grnItem.quantity,
            reference: `GRN: ${grnNumber}`,
            referenceId: grn.id,
            notes: `Received via PO: ${po.poNumber}`,
            createdBy: userId,
          },
        });

        // Handle batch tracking
        if (product.hasBatch && grnItem.batchNumber) {
          await tx.batch.create({
            data: {
              stockId: stock.id,
              batchNumber: grnItem.batchNumber,
              quantity: grnItem.quantity,
              expiryDate: grnItem.expiryDate ? new Date(grnItem.expiryDate) : null,
            },
          });
        }
      }

      // Check if all items are fully received
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });

      const allReceived = updatedPoItems.every(item => item.receivedQty >= item.quantity);

      // Update PO status
      if (allReceived) {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: OrderStatus.COMPLETED,
          },
        });
      } else if (po.status === OrderStatus.CONFIRMED) {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: OrderStatus.PROCESSING,
          },
        });
      }

      return {
        grn,
        message: `GRN ${grnNumber} created successfully. Stock updated for ${createGrnDto.items.length} products.`,
      };
    });
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    // Get PO IDs for this tenant
    const poIds = await this.prisma.purchaseOrder
      .findMany({
        where: { tenantId },
        select: { id: true },
      })
      .then(pos => pos.map(po => po.id));

    const where: any = {
      purchaseOrderId: { in: poIds },
    };

    if (search) {
      where.OR = [
        { grnNumber: { contains: search, mode: 'insensitive' } },
        { purchaseOrder: { poNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [grns, total] = await Promise.all([
      this.prisma.goodsReceivedNote.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          purchaseOrder: {
            select: {
              poNumber: true,
              vendor: {
                select: {
                  name: true,
                },
              },
            },
          },
          items: {
            select: {
              productId: true,
              quantity: true,
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.goodsReceivedNote.count({ where }),
    ]);

    return PaginationHelper.paginate(grns, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const grn = await this.prisma.goodsReceivedNote.findFirst({
      where: {
        id,
        purchaseOrder: {
          tenantId,
        },
      },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            items: true,
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
                    name: true,
                    symbol: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!grn) {
      throw new NotFoundException('GRN not found');
    }

    return grn;
  }
}

