import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorPaymentDto } from './dto/grn-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class VendorPaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, createPaymentDto: CreateVendorPaymentDto) {
    // Verify vendor
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id: createPaymentDto.vendorId,
        tenantId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Verify invoice if provided
    let invoice: any = null;
    if (createPaymentDto.invoiceId) {
      invoice = await this.prisma.purchaseInvoice.findFirst({
        where: {
          id: createPaymentDto.invoiceId,
          vendorId: createPaymentDto.vendorId,
          tenantId,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Check if payment amount exceeds balance
      if (createPaymentDto.amount > Number(invoice.balanceAmount)) {
        throw new BadRequestException(
          `Payment amount (${createPaymentDto.amount}) exceeds invoice balance (${invoice.balanceAmount})`,
        );
      }
    }

    // Generate payment number
    const count = await this.prisma.vendorPayment.count({ where: { tenantId } });
    const paymentNumber = `PAY-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    // Create payment and update invoice in transaction
    return this.prisma.$transaction(async tx => {
      const payment = await tx.vendorPayment.create({
        data: {
          tenantId,
          paymentNumber,
          vendorId: createPaymentDto.vendorId,
          invoiceId: createPaymentDto.invoiceId,
          amount: createPaymentDto.amount,
          method: createPaymentDto.method,
          paymentDate: createPaymentDto.paymentDate
            ? new Date(createPaymentDto.paymentDate)
            : new Date(),
          reference: createPaymentDto.reference,
          notes: createPaymentDto.notes,
          createdBy: userId,
        },
      });

      // Update invoice if provided
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + createPaymentDto.amount;
        const newBalanceAmount = Number(invoice.total) - newPaidAmount;

        let newStatus: PaymentStatus;
        if (newBalanceAmount <= 0) {
          newStatus = PaymentStatus.PAID;
        } else if (newPaidAmount > 0) {
          newStatus = PaymentStatus.PARTIAL;
        } else {
          newStatus = PaymentStatus.PENDING;
        }

        await tx.purchaseInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
          },
        });

        // Update PO payment status
        const poInvoices = await tx.purchaseInvoice.findMany({
          where: { purchaseOrderId: invoice.purchaseOrderId },
        });

        const allPaid = poInvoices.every(
          inv => inv.id === invoice.id ? newStatus === PaymentStatus.PAID : inv.status === PaymentStatus.PAID,
        );

        const anyPartial = poInvoices.some(
          inv => inv.id === invoice.id ? newStatus === PaymentStatus.PARTIAL : inv.status === PaymentStatus.PARTIAL,
        );

        let poPaymentStatus: PaymentStatus;
        if (allPaid) {
          poPaymentStatus = PaymentStatus.PAID;
        } else if (anyPartial) {
          poPaymentStatus = PaymentStatus.PARTIAL;
        } else {
          poPaymentStatus = PaymentStatus.PENDING;
        }

        await tx.purchaseOrder.update({
          where: { id: invoice.purchaseOrderId },
          data: {
            paidAmount: newPaidAmount,
            paymentStatus: poPaymentStatus,
          },
        });
      }

      return {
        payment,
        message: `Payment ${paymentNumber} recorded successfully`,
      };
    });
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [{ paymentNumber: { contains: search, mode: 'insensitive' } }];
    }

    const [payments, total] = await Promise.all([
      this.prisma.vendorPayment.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              total: true,
            },
          },
        },
      }),
      this.prisma.vendorPayment.count({ where }),
    ]);

    // Get vendor details
    const paymentsWithVendor = await Promise.all(
      payments.map(async payment => {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: payment.vendorId },
          select: {
            id: true,
            name: true,
            code: true,
          },
        });

        return {
          ...payment,
          vendor,
        };
      }),
    );

    return PaginationHelper.paginate(paymentsWithVendor, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.vendorPayment.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            grn: {
              select: {
                grnNumber: true,
                purchaseOrder: {
                  select: {
                    poNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Get vendor details
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: payment.vendorId },
    });

    return {
      ...payment,
      vendor,
    };
  }

  // Get payment history for a vendor
  async getVendorPaymentHistory(vendorId: string, tenantId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const payments = await this.prisma.vendorPayment.findMany({
      where: { vendorId },
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            total: true,
          },
        },
      },
    });

    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        code: vendor.code,
      },
      totalPaid,
      paymentCount: payments.length,
      payments,
    };
  }
}

