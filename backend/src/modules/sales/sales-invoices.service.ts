import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalesInvoiceDto } from './dto/delivery-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { PaymentStatus } from '@prisma/client';
import { JournalService } from '../accounting/journal.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesInvoicesService {
  constructor(
    private prisma: PrismaService,
    private journalService: JournalService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async create(tenantId: string, userId: string, createInvoiceDto: CreateSalesInvoiceDto) {
    // Verify SO
    const so = await this.prisma.salesOrder.findFirst({
      where: {
        id: createInvoiceDto.salesOrderId,
        tenantId,
      },
      include: {
        customer: true,
      },
    });

    if (!so) {
      throw new NotFoundException('Sales order not found');
    }

    // Verify customer matches
    if (so.customerId !== createInvoiceDto.customerId) {
      throw new BadRequestException('Customer does not match sales order');
    }

    // Verify delivery note if provided
    if (createInvoiceDto.deliveryNoteId) {
      const delivery = await this.prisma.deliveryNote.findFirst({
        where: {
          id: createInvoiceDto.deliveryNoteId,
          salesOrderId: so.id,
        },
      });

      if (!delivery) {
        throw new NotFoundException('Delivery note not found for this sales order');
      }
    }

    // Generate invoice number
    const count = await this.prisma.salesInvoice.count({ where: { tenantId } });
    const invoiceNumber = `SINV-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    const total =
      createInvoiceDto.subtotal +
      (createInvoiceDto.taxAmount || 0) -
      (createInvoiceDto.discount || 0);

    // Create invoice
    const invoice = await this.prisma.salesInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        salesOrderId: createInvoiceDto.salesOrderId,
        deliveryNoteId: createInvoiceDto.deliveryNoteId,
        customerId: createInvoiceDto.customerId,
        invoiceDate: createInvoiceDto.invoiceDate
          ? new Date(createInvoiceDto.invoiceDate)
          : new Date(),
        dueDate: new Date(createInvoiceDto.dueDate),
        subtotal: createInvoiceDto.subtotal,
        taxAmount: createInvoiceDto.taxAmount || 0,
        discount: createInvoiceDto.discount || 0,
        total,
        balanceAmount: total,
        notes: createInvoiceDto.notes,
        createdBy: userId,
      },
      include: {
        deliveryNote: {
          select: {
            deliveryNumber: true,
          },
        },
        salesOrder: {
          select: {
            soNumber: true,
          },
        },
      },
    });

    await this.journalService.postSalesInvoice(tenantId, invoice.id, {
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      customerName: so.customer.name,
    });

    await this.auditService.record(tenantId, userId, {
      action: 'CREATE',
      entity: 'SalesInvoice',
      entityId: invoice.id,
      changes: {
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        total: Number(invoice.total),
      },
    });

    await this.notificationsService.createPaymentReminder(
      tenantId,
      `Sales invoice due: ${invoice.invoiceNumber}`,
      `${so.customer.name} has ${Number(invoice.balanceAmount).toLocaleString()} due by ${invoice.dueDate.toDateString()}.`,
      { invoiceId: invoice.id, customerId: invoice.customerId, amount: Number(invoice.balanceAmount) },
    );

    return invoice;
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
      where.OR = [{ invoiceNumber: { contains: search, mode: 'insensitive' } }];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          deliveryNote: {
            select: {
              deliveryNumber: true,
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
          },
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
      }),
      this.prisma.salesInvoice.count({ where }),
    ]);

    return PaginationHelper.paginate(invoices, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, tenantId },
      include: {
        deliveryNote: {
          include: {
            salesOrder: {
              include: {
                customer: true,
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            items: true,
          },
        },
        salesOrder: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // Get outstanding invoices
  async getOutstandingInvoices(tenantId: string) {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        tenantId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
      include: {
        salesOrder: {
          select: {
            soNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Mark overdue invoices
    const now = new Date();
    const result = invoices.map(inv => ({
      ...inv,
      isOverdue: inv.dueDate < now && inv.status !== PaymentStatus.PAID,
      daysOverdue:
        inv.dueDate < now
          ? Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
    }));

    return result;
  }

  // Get customer-wise outstanding
  async getCustomerWiseOutstanding(tenantId: string) {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        tenantId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
      select: {
        customerId: true,
        balanceAmount: true,
        salesOrder: {
          select: {
            customer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Group by customer
    const customerMap = new Map<string, any>();

    invoices.forEach(inv => {
      const customer = inv.salesOrder.customer;
      if (!customer) return;

      if (!customerMap.has(customer.id)) {
        customerMap.set(customer.id, {
          customer,
          totalOutstanding: 0,
          invoiceCount: 0,
        });
      }

      const entry = customerMap.get(customer.id)!;
      entry.totalOutstanding += Number(inv.balanceAmount);
      entry.invoiceCount += 1;
    });

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalOutstanding - a.totalOutstanding,
    );
  }
}

