import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeliveryNoteDto } from './dto/delivery-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { OrderStatus, MovementType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(tenantId: string, userId: string, createDeliveryDto: CreateDeliveryNoteDto) {
    // Verify SO exists and belongs to tenant
    const so = await this.prisma.salesOrder.findFirst({
      where: {
        id: createDeliveryDto.salesOrderId,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!so) {
      throw new NotFoundException('Sales order not found');
    }

    // Check SO status
    if (so.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot deliver goods for cancelled sales order');
    }

    if (so.status === OrderStatus.DRAFT) {
      throw new BadRequestException('Sales order must be confirmed before delivery');
    }

    // Verify warehouse
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: createDeliveryDto.warehouseId,
        tenantId,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Validate delivery items against SO items
    for (const deliveryItem of createDeliveryDto.items) {
      const soItem = so.items.find(item => item.productId === deliveryItem.productId);

      if (!soItem) {
        throw new BadRequestException(
          `Product ${deliveryItem.productId} is not in sales order`,
        );
      }

      const pendingQty = soItem.quantity - soItem.deliveredQty;

      if (deliveryItem.quantity > pendingQty) {
        throw new BadRequestException(
          `Cannot deliver ${deliveryItem.quantity} units of ${soItem.product.name}. ` +
            `Only ${pendingQty} units pending (Ordered: ${soItem.quantity}, ` +
            `Already delivered: ${soItem.deliveredQty})`,
        );
      }

      // Check stock availability
      const stock = await this.prisma.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: deliveryItem.productId,
            warehouseId: createDeliveryDto.warehouseId,
          },
        },
        include: {
          batches: {
            where: {
              quantity: { gt: 0 },
            },
            orderBy: {
              expiryDate: 'asc', // FIFO: oldest first
            },
          },
          serials: {
            where: {
              isAvailable: true,
            },
          },
        },
      });

      if (!stock || stock.available < deliveryItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${soItem.product.name} in ${warehouse.name}. ` +
            `Available: ${stock?.available || 0}, Required: ${deliveryItem.quantity}`,
        );
      }

      // Validate batch if specified
      if (soItem.product.hasBatch && deliveryItem.batchNumber) {
        const batch = stock.batches.find(b => b.batchNumber === deliveryItem.batchNumber);
        if (!batch || batch.quantity < deliveryItem.quantity) {
          throw new BadRequestException(
            `Insufficient quantity in batch ${deliveryItem.batchNumber}`,
          );
        }
      }

      // Validate serials if specified
      if (soItem.product.hasSerial && deliveryItem.serialNumbers) {
        if (deliveryItem.serialNumbers.length !== deliveryItem.quantity) {
          throw new BadRequestException(
            `Number of serial numbers must match quantity for ${soItem.product.name}`,
          );
        }

        const availableSerials = stock.serials.filter(s =>
          deliveryItem.serialNumbers!.includes(s.serialNumber),
        );

        if (availableSerials.length !== deliveryItem.serialNumbers.length) {
          throw new BadRequestException(
            `One or more serial numbers not found or already delivered for ${soItem.product.name}`,
          );
        }
      }
    }

    // Generate delivery number
    const count = await this.prisma.deliveryNote.count();
    const deliveryNumber = `DN-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    // Create delivery and update stock in transaction
    const result = await this.prisma.$transaction(async tx => {
      // Create delivery note
      const delivery = await tx.deliveryNote.create({
        data: {
          deliveryNumber,
          salesOrderId: createDeliveryDto.salesOrderId,
          warehouseId: createDeliveryDto.warehouseId,
          deliveryDate: createDeliveryDto.deliveryDate
            ? new Date(createDeliveryDto.deliveryDate)
            : new Date(),
          deliveredBy: userId,
          notes: createDeliveryDto.notes,
          items: {
            create: createDeliveryDto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              batchNumber: item.batchNumber,
              serialNumbers: item.serialNumbers || [],
            })),
          },
        },
        include: {
          items: true,
          salesOrder: {
            select: {
              soNumber: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update delivered quantities in SO items and process inventory OUT
      for (const deliveryItem of createDeliveryDto.items) {
        const soItem = so.items.find(item => item.productId === deliveryItem.productId);

        await tx.salesOrderItem.update({
          where: { id: soItem!.id },
          data: {
            deliveredQty: soItem!.deliveredQty + deliveryItem.quantity,
          },
        });

        const product = soItem!.product;

        // Get stock record
        const stock = await tx.stock.findUnique({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: createDeliveryDto.warehouseId,
            },
          },
          include: {
            batches: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
            },
          },
        });

        if (!stock) {
          throw new BadRequestException(`Stock record not found for ${product.name}`);
        }

        // Update stock quantities
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: stock.quantity - deliveryItem.quantity,
            available: stock.available - deliveryItem.quantity,
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            warehouseId: createDeliveryDto.warehouseId,
            productId: product.id,
            type: MovementType.OUT,
            quantity: deliveryItem.quantity,
            reference: `Delivery: ${deliveryNumber}`,
            referenceId: delivery.id,
            notes: `Delivered for SO: ${so.soNumber}`,
            createdBy: userId,
          },
        });

        // Handle batch deduction (FIFO)
        if (product.hasBatch) {
          let remainingQty = deliveryItem.quantity;

          if (deliveryItem.batchNumber) {
            // Specific batch requested
            const batch = await tx.batch.findFirst({
              where: {
                stockId: stock.id,
                batchNumber: deliveryItem.batchNumber,
              },
            });

            if (batch) {
              await tx.batch.update({
                where: { id: batch.id },
                data: {
                  quantity: batch.quantity - deliveryItem.quantity,
                },
              });
            }
          } else {
            // FIFO: Use oldest batches first
            for (const batch of stock.batches) {
              if (remainingQty <= 0) break;

              const deductQty = Math.min(batch.quantity, remainingQty);

              await tx.batch.update({
                where: { id: batch.id },
                data: {
                  quantity: batch.quantity - deductQty,
                },
              });

              remainingQty -= deductQty;
            }
          }
        }

        // Handle serial number deduction
        if (product.hasSerial && deliveryItem.serialNumbers && deliveryItem.serialNumbers.length > 0) {
          // Mark serials as unavailable (delivered)
          await tx.serial.updateMany({
            where: {
              stockId: stock.id,
              serialNumber: { in: deliveryItem.serialNumbers },
            },
            data: {
              isAvailable: false,
            },
          });
        }
      }

      // Check if all items are fully delivered
      const updatedSoItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: so.id },
      });

      const allDelivered = updatedSoItems.every(item => item.deliveredQty >= item.quantity);

      // Update SO status
      if (allDelivered) {
        await tx.salesOrder.update({
          where: { id: so.id },
          data: {
            status: OrderStatus.COMPLETED,
          },
        });
      } else if (so.status === OrderStatus.CONFIRMED) {
        await tx.salesOrder.update({
          where: { id: so.id },
          data: {
            status: OrderStatus.PROCESSING,
          },
        });
      }

      return {
        delivery,
        message: `Delivery ${deliveryNumber} created successfully. Stock updated for ${createDeliveryDto.items.length} products.`,
      };
    });

    await this.auditService.record(tenantId, userId, {
      action: 'CREATE',
      entity: 'DeliveryNote',
      entityId: result.delivery.id,
      changes: {
        deliveryNumber: result.delivery.deliveryNumber,
        salesOrderId: result.delivery.salesOrderId,
        warehouseId: result.delivery.warehouseId,
        itemCount: createDeliveryDto.items.length,
      },
    });

    return result;
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    // Get SO IDs for this tenant
    const soIds = await this.prisma.salesOrder
      .findMany({
        where: { tenantId },
        select: { id: true },
      })
      .then(sos => sos.map(so => so.id));

    const where: any = {
      salesOrderId: { in: soIds },
    };

    if ((paginationDto as any).salesOrderId) {
      where.salesOrderId = (paginationDto as any).salesOrderId;
    }

    if (search) {
      where.OR = [
        { deliveryNumber: { contains: search, mode: 'insensitive' } },
        { salesOrder: { soNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.deliveryNote.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          salesOrder: {
            select: {
              soNumber: true,
              customer: {
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
            },
          },
        },
      }),
      this.prisma.deliveryNote.count({ where }),
    ]);

    return PaginationHelper.paginate(deliveries, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const delivery = await this.prisma.deliveryNote.findFirst({
      where: {
        id,
        salesOrder: {
          tenantId,
        },
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
            items: true,
          },
        },
        warehouse: true,
        items: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery note not found');
    }

    return delivery;
  }
}

