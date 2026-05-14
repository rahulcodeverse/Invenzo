import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuotationDto, UpdateQuotationDto } from './dto/quotation-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, createQuotationDto: CreateQuotationDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findFirst({
      where: { id: createQuotationDto.customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify all products exist
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: createQuotationDto.items.map(item => item.productId) },
        tenantId,
      },
    });

    if (products.length !== createQuotationDto.items.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Generate quotation number
    const count = await this.prisma.quotation.count({ where: { tenantId } });
    const quotationNumber = `QT-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const itemsWithCalculations = createQuotationDto.items.map(item => {
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

    const discount = createQuotationDto.discount || 0;
    const total = subtotal + taxAmount - discount;

    // Create quotation
    return this.prisma.quotation.create({
      data: {
        tenantId,
        quotationNumber,
        customerId: createQuotationDto.customerId,
        validUntil: new Date(createQuotationDto.validUntil),
        subtotal,
        taxAmount,
        discount,
        total,
        notes: createQuotationDto.notes,
        termsConditions: createQuotationDto.termsConditions,
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
        items: true,
      },
    });
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
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [quotations, total] = await Promise.all([
      this.prisma.quotation.findMany({
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
            },
          },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return PaginationHelper.paginate(quotations, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    return quotation;
  }

  async update(id: string, tenantId: string, updateQuotationDto: UpdateQuotationDto) {
    const existing = await this.findOne(id, tenantId);

    // Check if quotation can be updated
    if (existing.convertedToSO) {
      throw new BadRequestException('Cannot update quotation that has been converted to sales order');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update cancelled quotation');
    }

    // If items are being updated, recalculate totals
    if (updateQuotationDto.items) {
      let subtotal = 0;
      let taxAmount = 0;

      const itemsWithCalculations = updateQuotationDto.items.map(item => {
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

      const discount = updateQuotationDto.discount !== undefined
        ? updateQuotationDto.discount
        : existing.discount;
      const total = subtotal + taxAmount - Number(discount);

      return this.prisma.$transaction(async tx => {
        // Delete existing items
        await tx.quotationItem.deleteMany({
          where: { quotationId: id },
        });

        // Create new items
        return tx.quotation.update({
          where: { id },
          data: {
            validUntil: updateQuotationDto.validUntil ? new Date(updateQuotationDto.validUntil) : undefined,
            subtotal,
            taxAmount,
            discount,
            total,
            notes: updateQuotationDto.notes,
            termsConditions: updateQuotationDto.termsConditions,
            status: updateQuotationDto.status,
            items: {
              create: itemsWithCalculations,
            },
          },
          include: {
            customer: true,
            items: true,
          },
        });
      });
    }

    // Simple update without items
    return this.prisma.quotation.update({
      where: { id },
      data: {
        validUntil: updateQuotationDto.validUntil ? new Date(updateQuotationDto.validUntil) : undefined,
        discount: updateQuotationDto.discount,
        notes: updateQuotationDto.notes,
        termsConditions: updateQuotationDto.termsConditions,
        status: updateQuotationDto.status,
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async convertToSalesOrder(id: string, tenantId: string, userId: string) {
    const quotation = await this.findOne(id, tenantId);

    if (quotation.convertedToSO) {
      throw new BadRequestException('Quotation already converted to sales order');
    }

    if (quotation.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed quotations can be converted to sales orders');
    }

    // Check if quotation is expired
    if (new Date() > quotation.validUntil) {
      throw new BadRequestException('Quotation has expired');
    }

    // Create sales order from quotation
    const soCount = await this.prisma.salesOrder.count({ where: { tenantId } });
    const soNumber = `SO-${new Date().getFullYear()}-${(soCount + 1)
      .toString()
      .padStart(4, '0')}`;

    return this.prisma.$transaction(async tx => {
      // Create sales order
      const salesOrder = await tx.salesOrder.create({
        data: {
          tenantId,
          soNumber,
          customerId: quotation.customerId,
          quotationId: id,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          discount: quotation.discount,
          total: quotation.total,
          notes: quotation.notes,
          createdBy: userId,
          items: {
            create: quotation.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              discount: item.discount,
              total: item.total,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // Mark quotation as converted
      await tx.quotation.update({
        where: { id },
        data: {
          convertedToSO: true,
          salesOrderId: salesOrder.id,
        },
      });

      return salesOrder;
    });
  }

  async remove(id: string, tenantId: string) {
    const quotation = await this.findOne(id, tenantId);

    if (quotation.convertedToSO) {
      throw new BadRequestException('Cannot delete quotation that has been converted to sales order');
    }

    await this.prisma.quotation.delete({
      where: { id },
    });

    return { message: 'Quotation deleted successfully' };
  }
}

