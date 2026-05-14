import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    // Generate customer code
    const count = await this.prisma.customer.count({ where: { tenantId } });
    const code = `CUS-${(count + 1).toString().padStart(4, '0')}`;

    // Check for duplicate code
    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Customer code already exists');
    }

    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
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

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              salesOrders: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return PaginationHelper.paginate(customers, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        salesOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            soNumber: true,
            orderDate: true,
            status: true,
            total: true,
          },
        },
        _count: {
          select: {
            salesOrders: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate outstanding amount
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        customerId: id,
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
      ...customer,
      outstandingAmount,
    };
  }

  async update(id: string, tenantId: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id, tenantId);

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    // Check for associated sales orders
    const soCount = await this.prisma.salesOrder.count({
      where: { customerId: id },
    });

    if (soCount > 0) {
      throw new ConflictException(
        `Cannot delete customer with ${soCount} sales orders. Deactivate instead.`,
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  // Get customer statement
  async getCustomerStatement(customerId: string, tenantId: string) {
    const customer = await this.findOne(customerId, tenantId);

    const [salesOrders, invoices, payments] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          soNumber: true,
          orderDate: true,
          status: true,
          total: true,
        },
      }),
      this.prisma.salesInvoice.findMany({
        where: { customerId },
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
      this.prisma.customerPayment.findMany({
        where: { customerId },
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

    const totalSales = salesOrders
      .filter(so => so.status !== 'CANCELLED')
      .reduce((sum, so) => sum + Number(so.total), 0);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount),
      0,
    );

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        code: customer.code,
        creditLimit: customer.creditLimit,
        creditDays: customer.creditDays,
      },
      summary: {
        totalSales,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
      },
      salesOrders,
      invoices,
      payments,
    };
  }
}

