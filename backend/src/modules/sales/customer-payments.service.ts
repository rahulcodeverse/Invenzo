import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerPaymentDto } from './dto/delivery-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { PaymentStatus } from '@prisma/client';
import { JournalService } from '../accounting/journal.service';

@Injectable()
export class CustomerPaymentsService {
  constructor(
    private prisma: PrismaService,
    private journalService: JournalService,
  ) {}

  async create(tenantId: string, userId: string, createPaymentDto: CreateCustomerPaymentDto) {
    // Verify customer
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: createPaymentDto.customerId,
        tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify invoice if provided
    let invoice: any = null;
    if (createPaymentDto.invoiceId) {
      invoice = await this.prisma.salesInvoice.findFirst({
        where: {
          id: createPaymentDto.invoiceId,
          customerId: createPaymentDto.customerId,
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
    const count = await this.prisma.customerPayment.count({ where: { tenantId } });
    const paymentNumber = `RCPT-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;

    // Create payment and update invoice in transaction
    const result = await this.prisma.$transaction(async tx => {
      const payment = await tx.customerPayment.create({
        data: {
          tenantId,
          paymentNumber,
          customerId: createPaymentDto.customerId,
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

        await tx.salesInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
          },
        });

        // Update SO payment status
        const soInvoices = await tx.salesInvoice.findMany({
          where: { salesOrderId: invoice.salesOrderId },
        });

        const allPaid = soInvoices.every(
          inv =>
            inv.id === invoice.id
              ? newStatus === PaymentStatus.PAID
              : inv.status === PaymentStatus.PAID,
        );

        const anyPartial = soInvoices.some(
          inv =>
            inv.id === invoice.id
              ? newStatus === PaymentStatus.PARTIAL
              : inv.status === PaymentStatus.PARTIAL,
        );

        let soPaymentStatus: PaymentStatus;
        if (allPaid) {
          soPaymentStatus = PaymentStatus.PAID;
        } else if (anyPartial) {
          soPaymentStatus = PaymentStatus.PARTIAL;
        } else {
          soPaymentStatus = PaymentStatus.PENDING;
        }

        await tx.salesOrder.update({
          where: { id: invoice.salesOrderId },
          data: {
            paidAmount: newPaidAmount,
            paymentStatus: soPaymentStatus,
          },
        });
      }

      return {
        payment,
        message: `Payment ${paymentNumber} recorded successfully`,
      };
    });

    await this.journalService.postCustomerPayment(tenantId, result.payment.id, {
      amount: Number(result.payment.amount),
      customerName: customer.name,
      method: result.payment.method,
    });

    return result;
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if ((paginationDto as any).customerId) {
      where.customerId = (paginationDto as any).customerId;
    }

    if (search) {
      where.OR = [{ paymentNumber: { contains: search, mode: 'insensitive' } }];
    }

    const [payments, total] = await Promise.all([
      this.prisma.customerPayment.findMany({
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
      this.prisma.customerPayment.count({ where }),
    ]);

    // Get customer details
    const paymentsWithCustomer = await Promise.all(
      payments.map(async payment => {
        const customer = await this.prisma.customer.findUnique({
          where: { id: payment.customerId },
          select: {
            id: true,
            name: true,
            code: true,
          },
        });

        return {
          ...payment,
          customer,
        };
      }),
    );

    return PaginationHelper.paginate(paymentsWithCustomer, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.customerPayment.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            deliveryNote: {
              select: {
                deliveryNumber: true,
                salesOrder: {
                  select: {
                    soNumber: true,
                  },
                },
              },
            },
            salesOrder: {
              select: {
                soNumber: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Get customer details
    const customer = await this.prisma.customer.findUnique({
      where: { id: payment.customerId },
    });

    return {
      ...payment,
      customer,
    };
  }

  // Get payment history for a customer
  async getCustomerPaymentHistory(customerId: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const payments = await this.prisma.customerPayment.findMany({
      where: { customerId },
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
      customer: {
        id: customer.id,
        name: customer.name,
        code: customer.code,
      },
      totalPaid,
      paymentCount: payments.length,
      payments,
    };
  }
}

