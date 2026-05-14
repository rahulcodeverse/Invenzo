import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createVendorDto: CreateVendorDto) {
    // Generate vendor code
    const count = await this.prisma.vendor.count({ where: { tenantId } });
    const code = `VEN-${(count + 1).toString().padStart(4, '0')}`;

    // Check for duplicate code
    const existing = await this.prisma.vendor.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Vendor code already exists');
    }

    return this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        code,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              purchaseOrders: true,
            },
          },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return PaginationHelper.paginate(vendors, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            poNumber: true,
            orderDate: true,
            status: true,
            total: true,
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Calculate outstanding amount
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        vendorId: id,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      select: {
        balanceAmount: true,
      },
    });

    const outstandingAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount),
      0,
    );

    return {
      ...vendor,
      outstandingAmount,
    };
  }

  async update(id: string, tenantId: string, updateVendorDto: UpdateVendorDto) {
    const existing = await this.findOne(id, tenantId);

    return this.prisma.vendor.update({
      where: { id },
      data: updateVendorDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    // Check for associated purchase orders
    const poCount = await this.prisma.purchaseOrder.count({
      where: { vendorId: id },
    });

    if (poCount > 0) {
      throw new ConflictException(
        `Cannot delete vendor with ${poCount} purchase orders. Deactivate instead.`,
      );
    }

    await this.prisma.vendor.delete({
      where: { id },
    });

    return { message: 'Vendor deleted successfully' };
  }

  // Get vendor statement
  async getVendorStatement(vendorId: string, tenantId: string) {
    const vendor = await this.findOne(vendorId, tenantId);

    const [purchaseOrders, invoices, payments] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          poNumber: true,
          orderDate: true,
          status: true,
          total: true,
        },
      }),
      this.prisma.purchaseInvoice.findMany({
        where: { vendorId },
        orderBy: { invoiceDate: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          total: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
        },
      }),
      this.prisma.vendorPayment.findMany({
        where: { vendorId },
        orderBy: { paymentDate: 'desc' },
        select: {
          id: true,
          paymentNumber: true,
          paymentDate: true,
          amount: true,
          method: true,
          reference: true,
        },
      }),
    ]);

    const totalPurchases = purchaseOrders
      .filter(po => po.status !== 'CANCELLED')
      .reduce((sum, po) => sum + Number(po.total), 0);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount),
      0,
    );

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        code: vendor.code,
        creditLimit: vendor.creditLimit,
        creditDays: vendor.creditDays,
      },
      summary: {
        totalPurchases,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
      },
      purchaseOrders,
      invoices,
      payments,
    };
  }
}

