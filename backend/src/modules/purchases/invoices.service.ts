import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseInvoiceDto, CreateVendorPaymentDto } from './dto/grn-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { PaymentStatus } from '@prisma/client';
import { JournalService } from '../accounting/journal.service';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private prisma: PrismaService,
    private journalService: JournalService,
  ) {}

  async create(tenantId: string, userId: string, createInvoiceDto: CreatePurchaseInvoiceDto) {
    // Verify PO
    const po = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: createInvoiceDto.purchaseOrderId,
        tenantId,
      },
      include: {
        vendor: true,
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    // Verify vendor matches
    if (po.vendorId !== createInvoiceDto.vendorId) {
      throw new BadRequestException('Vendor does not match purchase order');
    }

    // Verify GRN if provided
    if (createInvoiceDto.grnId) {
      const grn = await this.prisma.goodsReceivedNote.findFirst({
        where: {
          id: createInvoiceDto.grnId,
          purchaseOrderId: po.id,
        },
      });

      if (!grn) {
        throw new NotFoundException('GRN not found for this purchase order');
      }
    }

    // Generate invoice number
    const count = await this.prisma.purchaseInvoice.count({ where: { tenantId } });
    const invoiceNumber = `PINV-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    const total =
      createInvoiceDto.subtotal + (createInvoiceDto.taxAmount || 0) - (createInvoiceDto.discount || 0);

    // Create invoice
    const invoice = await this.prisma.purchaseInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        purchaseOrderId: createInvoiceDto.purchaseOrderId,
        grnId: createInvoiceDto.grnId,
        vendorId: createInvoiceDto.vendorId,
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
        grn: {
          select: {
            grnNumber: true,
          },
        },
      },
    });

    await this.journalService.postPurchaseInvoice(tenantId, invoice.id, {
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      vendorName: po.vendor.name,
    });

    return invoice;
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [{ invoiceNumber: { contains: search, mode: 'insensitive' } }];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.purchaseInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          grn: {
            select: {
              grnNumber: true,
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
          },
        },
      }),
      this.prisma.purchaseInvoice.count({ where }),
    ]);

    return PaginationHelper.paginate(invoices, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: {
        grn: {
          include: {
            purchaseOrder: {
              include: {
                vendor: true,
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
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
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
      include: {
        grn: {
          select: {
            purchaseOrder: {
              select: {
                poNumber: true,
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
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

  // Get vendor-wise outstanding
  async getVendorWiseOutstanding(tenantId: string) {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        tenantId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
      select: {
        vendorId: true,
        balanceAmount: true,
        grn: {
          select: {
            purchaseOrder: {
              select: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group by vendor
    const vendorMap = new Map<string, any>();

    invoices.forEach(inv => {
      const vendor = inv.grn?.purchaseOrder.vendor;
      if (!vendor) return;

      if (!vendorMap.has(vendor.id)) {
        vendorMap.set(vendor.id, {
          vendor,
          totalOutstanding: 0,
          invoiceCount: 0,
        });
      }

      const entry = vendorMap.get(vendor.id)!;
      entry.totalOutstanding += Number(inv.balanceAmount);
      entry.invoiceCount += 1;
    });

    return Array.from(vendorMap.values()).sort(
      (a, b) => b.totalOutstanding - a.totalOutstanding,
    );
  }
}

