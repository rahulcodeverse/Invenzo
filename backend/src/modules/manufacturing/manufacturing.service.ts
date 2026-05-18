import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PurchaseIndentStatus, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { CreateBomDto, CreatePurchaseIndentsDto, CreateWorkOrderDto, UpdateBomDto, UpdatePurchaseIndentDto, UpdateWorkOrderDto } from './dto/manufacturing.dto';

@Injectable()
export class ManufacturingService {
  constructor(private prisma: PrismaService) {}

  async createBom(tenantId: string, userId: string, dto: CreateBomDto) {
    await this.assertProduct(tenantId, dto.productId);

    if (!dto.items.length) {
      throw new BadRequestException('BOM must contain at least one material');
    }

    for (const item of dto.items) {
      if (item.materialId === dto.productId) {
        throw new BadRequestException('Finished product cannot be used as its own material');
      }
      await this.assertProduct(tenantId, item.materialId);
    }

    const bomNumber = await this.nextNumber(tenantId, 'BOM', 'billOfMaterial', 'bomNumber');

    return this.prisma.billOfMaterial.create({
      data: {
        tenantId,
        createdBy: userId,
        bomNumber,
        productId: dto.productId,
        name: dto.name,
        version: dto.version || '1.0',
        outputQty: dto.outputQty || 1,
        notes: dto.notes,
        items: {
          create: dto.items.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            wastagePercent: item.wastagePercent || 0,
            notes: item.notes,
          })),
        },
        routingSteps: {
          create: (dto.routingSteps || []).map(step => ({
            sequence: step.sequence,
            processName: step.processName,
            workCenter: step.workCenter,
            estimatedMinutes: step.estimatedMinutes,
            instructions: step.instructions,
          })),
        },
      },
      include: this.bomInclude(),
    });
  }

  async findBoms(tenantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { bomNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.billOfMaterial.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: this.bomInclude(),
      }),
      this.prisma.billOfMaterial.count({ where }),
    ]);

    return PaginationHelper.paginate(data, total, page, limit);
  }

  async findBom(id: string, tenantId: string) {
    const bom = await this.prisma.billOfMaterial.findFirst({
      where: { id, tenantId },
      include: this.bomInclude(),
    });

    if (!bom) {
      throw new NotFoundException('BOM not found');
    }

    return bom;
  }

  async updateBom(id: string, tenantId: string, dto: UpdateBomDto) {
    await this.findBom(id, tenantId);

    return this.prisma.billOfMaterial.update({
      where: { id },
      data: dto,
      include: this.bomInclude(),
    });
  }

  async createWorkOrder(tenantId: string, userId: string, dto: CreateWorkOrderDto) {
    const bom = await this.findBom(dto.bomId, tenantId);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const workOrderNumber = await this.nextNumber(tenantId, 'WO', 'workOrder', 'workOrderNumber');
    const outputQty = Number(bom.outputQty || 1);
    const multiplier = dto.plannedQty / outputQty;

    return this.prisma.workOrder.create({
      data: {
        tenantId,
        createdBy: userId,
        workOrderNumber,
        bomId: bom.id,
        productId: bom.productId,
        warehouseId: dto.warehouseId,
        salesOrderId: dto.salesOrderId,
        plannedQty: dto.plannedQty,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        materials: {
          create: bom.items.map(item => ({
            productId: item.materialId,
            plannedQty: Number(item.quantity) * multiplier * (1 + Number(item.wastagePercent) / 100),
          })),
        },
      },
      include: this.workOrderInclude(),
    });
  }

  async findWorkOrders(tenantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { workOrderNumber: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: this.workOrderInclude(),
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return PaginationHelper.paginate(data, total, page, limit);
  }

  async updateWorkOrder(id: string, tenantId: string, dto: UpdateWorkOrderDto) {
    const workOrder = await this.prisma.workOrder.findFirst({ where: { id, tenantId } });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const completedAt = dto.status === WorkOrderStatus.COMPLETED ? new Date() : undefined;

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: dto.status,
        producedQty: dto.producedQty,
        rejectedQty: dto.rejectedQty,
        notes: dto.notes,
        completedAt,
      },
      include: this.workOrderInclude(),
    });
  }

  async getProductionSummary(tenantId: string) {
    const [bomCount, planned, wip, completed, openIndents] = await Promise.all([
      this.prisma.billOfMaterial.count({ where: { tenantId, isActive: true } }),
      this.prisma.workOrder.count({ where: { tenantId, status: WorkOrderStatus.PLANNED } }),
      this.prisma.workOrder.count({ where: { tenantId, status: { in: [WorkOrderStatus.RELEASED, WorkOrderStatus.IN_PROGRESS] } } }),
      this.prisma.workOrder.count({ where: { tenantId, status: WorkOrderStatus.COMPLETED } }),
      this.prisma.purchaseIndent.count({ where: { tenantId, status: PurchaseIndentStatus.OPEN } }),
    ]);

    return { bomCount, planned, wip, completed, openIndents };
  }

  async calculateMrp(tenantId: string, requiredBy?: string) {
    const demandDate = requiredBy ? new Date(requiredBy) : undefined;
    const salesOrders = await this.prisma.salesOrder.findMany({
      where: {
        tenantId,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
        ...(demandDate ? { deliveryDate: { lte: demandDate } } : {}),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    const demand = new Map<string, any>();

    const addDemand = (product: any, qty: number, source: any, isMaterial: boolean) => {
      const current = demand.get(product.id) ?? {
        product,
        requiredQty: 0,
        sources: [],
        isMaterial,
      };
      current.requiredQty += qty;
      current.isMaterial = current.isMaterial || isMaterial;
      current.sources.push(source);
      demand.set(product.id, current);
    };

    for (const order of salesOrders) {
      for (const item of order.items) {
        const pendingQty = item.quantity - item.deliveredQty;
        if (pendingQty <= 0) continue;

        addDemand(
          item.product,
          pendingQty,
          { type: 'SALES_ORDER', id: order.id, reference: order.soNumber, requiredBy: order.deliveryDate },
          false,
        );

        const bom = await this.prisma.billOfMaterial.findFirst({
          where: { tenantId, productId: item.productId, isActive: true },
          include: {
            items: {
              include: {
                material: { select: { id: true, sku: true, name: true, unit: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!bom) continue;

        const outputQty = Number(bom.outputQty || 1);
        const multiplier = pendingQty / outputQty;

        for (const material of bom.items) {
          const wastage = 1 + Number(material.wastagePercent || 0) / 100;
          addDemand(
            material.material,
            Number(material.quantity) * multiplier * wastage,
            { type: 'BOM', id: bom.id, reference: `${order.soNumber} / ${bom.bomNumber}`, requiredBy: order.deliveryDate },
            true,
          );
        }
      }
    }

    const productIds = [...demand.keys()];
    const stocks = await this.prisma.stock.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, product: { tenantId } },
      _sum: { available: true },
    });
    const stockMap = new Map(stocks.map(stock => [stock.productId, stock._sum.available || 0]));

    const openIndents = await this.prisma.purchaseIndent.groupBy({
      by: ['productId'],
      where: { tenantId, productId: { in: productIds }, status: PurchaseIndentStatus.OPEN },
      _sum: { shortageQty: true },
    });
    const indentMap = new Map(openIndents.map(indent => [indent.productId, Number(indent._sum.shortageQty || 0)]));

    const lines = [...demand.values()].map(line => {
      const availableQty = Number(stockMap.get(line.product.id) || 0);
      const openIndentQty = indentMap.get(line.product.id) || 0;
      const shortageQty = Math.max(0, Number((line.requiredQty - availableQty - openIndentQty).toFixed(3)));
      return {
        product: line.product,
        requiredQty: Number(line.requiredQty.toFixed(3)),
        availableQty,
        openIndentQty,
        shortageQty,
        action: shortageQty > 0 ? 'CREATE_INDENT' : 'NONE',
        sourceCount: line.sources.length,
        sources: line.sources,
        isMaterial: line.isMaterial,
      };
    }).sort((a, b) => b.shortageQty - a.shortageQty || a.product.name.localeCompare(b.product.name));

    return {
      requiredBy: demandDate,
      demandOrders: salesOrders.length,
      shortageCount: lines.filter(line => line.shortageQty > 0).length,
      lines,
    };
  }

  async createPurchaseIndentsFromMrp(tenantId: string, userId: string, dto: CreatePurchaseIndentsDto) {
    const mrp = await this.calculateMrp(tenantId, dto.requiredBy);
    const shortages = mrp.lines.filter(line => line.shortageQty > 0);

    if (!shortages.length) {
      return { created: 0, indents: [], message: 'No shortages found for selected demand.' };
    }

    const count = await this.prisma.purchaseIndent.count({ where: { tenantId } });
    const indents = await this.prisma.$transaction(
      shortages.map((line, index) => {
        const primarySource = line.sources[0];
        return this.prisma.purchaseIndent.create({
          data: {
            tenantId,
            indentNumber: `IND-${new Date().getFullYear()}-${String(count + index + 1).padStart(4, '0')}`,
            productId: line.product.id,
            requiredQty: line.requiredQty,
            availableQty: line.availableQty,
            shortageQty: line.shortageQty,
            sourceType: primarySource?.type || 'MRP',
            sourceId: primarySource?.id,
            sourceReference: primarySource?.reference,
            requiredBy: dto.requiredBy ? new Date(dto.requiredBy) : primarySource?.requiredBy,
            notes: `Generated from MRP. Open indent already considered: ${line.openIndentQty}.`,
            createdBy: userId,
          },
          include: this.purchaseIndentInclude(),
        });
      }),
    );

    return { created: indents.length, indents };
  }

  async findPurchaseIndents(tenantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);
    const where: any = { tenantId };

    if ((pagination as any).status) {
      where.status = (pagination as any).status;
    }

    if (search) {
      where.OR = [
        { indentNumber: { contains: search, mode: 'insensitive' } },
        { sourceReference: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseIndent.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: this.purchaseIndentInclude(),
      }),
      this.prisma.purchaseIndent.count({ where }),
    ]);

    return PaginationHelper.paginate(data, total, page, limit);
  }

  async updatePurchaseIndent(id: string, tenantId: string, dto: UpdatePurchaseIndentDto) {
    const indent = await this.prisma.purchaseIndent.findFirst({ where: { id, tenantId } });
    if (!indent) {
      throw new NotFoundException('Purchase indent not found');
    }

    return this.prisma.purchaseIndent.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
      },
      include: this.purchaseIndentInclude(),
    });
  }

  private async assertProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async nextNumber(tenantId: string, prefix: string, model: 'billOfMaterial' | 'workOrder', field: 'bomNumber' | 'workOrderNumber') {
    const count = await (this.prisma[model] as any).count({ where: { tenantId } });
    return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }

  private bomInclude() {
    return {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      items: { include: { material: { select: { id: true, sku: true, name: true, unit: true, costPrice: true } } } },
      routingSteps: { orderBy: { sequence: 'asc' as const } },
    };
  }

  private workOrderInclude() {
    return {
      bom: { select: { id: true, bomNumber: true, name: true, version: true } },
      product: { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      materials: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
    };
  }

  private purchaseIndentInclude() {
    return {
      product: { select: { id: true, sku: true, name: true, unit: true, costPrice: true } },
    };
  }
}
