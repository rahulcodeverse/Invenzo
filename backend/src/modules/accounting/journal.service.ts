import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJournalEntryDto, QueryJournalDto } from './dto/journal.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { JournalType } from '@prisma/client';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async createJournal(tenantId: string, userId: string, createDto: CreateJournalEntryDto) {
    // Validate all accounts exist
    const accountIds = createDto.lines.map(l => l.accountId);
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: {
        id: { in: accountIds },
        tenantId,
      },
    });

    if (accounts.length !== accountIds.length) {
      throw new NotFoundException('One or more accounts not found');
    }

    // Calculate totals
    const totalDebit = createDto.lines
      .filter(l => l.type === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);

    const totalCredit = createDto.lines
      .filter(l => l.type === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);

    // Validate double-entry (Debit = Credit)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Journal entry not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      );
    }

    // Generate journal number
    const count = await this.prisma.journalEntry.count({ where: { tenantId } });
    const journalNumber = `JE-${new Date().getFullYear()}-${(count + 1)
      .toString()
      .padStart(5, '0')}`;

    // Create journal entry and update account balances
    return this.prisma.$transaction(async tx => {
      const journal = await tx.journalEntry.create({
        data: {
          tenantId,
          journalNumber,
          type: createDto.type,
          date: createDto.date ? new Date(createDto.date) : new Date(),
          reference: createDto.reference,
          referenceId: createDto.referenceId,
          narration: createDto.narration,
          totalDebit,
          totalCredit,
          createdBy: userId,
          lines: {
            create: createDto.lines.map(line => ({
              accountId: line.accountId,
              type: line.type,
              amount: line.amount,
              narration: line.narration,
            })),
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      // Update account balances
      for (const line of createDto.lines) {
        const account = accounts.find(a => a.id === line.accountId)!;
        let balanceChange = 0;

        // Calculate balance change based on account type
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          balanceChange = line.type === 'DEBIT' ? line.amount : -line.amount;
        } else {
          balanceChange = line.type === 'CREDIT' ? line.amount : -line.amount;
        }

        await tx.ledgerAccount.update({
          where: { id: line.accountId },
          data: {
            currentBalance: {
              increment: balanceChange,
            },
          },
        });
      }

      return journal;
    });
  }

  async findAllJournals(tenantId: string, paginationDto: PaginationDto, queryDto?: QueryJournalDto) {
    const { page = 1, limit = 50, sortBy = 'date', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (queryDto) {
      if (queryDto.type) {
        where.type = queryDto.type;
      }

      if (queryDto.fromDate || queryDto.toDate) {
        where.date = {};
        if (queryDto.fromDate) where.date.gte = new Date(queryDto.fromDate);
        if (queryDto.toDate) where.date.lte = new Date(queryDto.toDate);
      }

      if (queryDto.accountId) {
        where.lines = {
          some: {
            accountId: queryDto.accountId,
          },
        };
      }
    }

    const [journals, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return PaginationHelper.paginate(journals, total, page, limit);
  }

  async findJournal(id: string, tenantId: string) {
    const journal = await this.prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!journal) {
      throw new NotFoundException('Journal entry not found');
    }

    return journal;
  }

  async reverseJournal(id: string, tenantId: string, userId: string, narration: string) {
    const original = await this.findJournal(id, tenantId);

    if (original.isReversed) {
      throw new BadRequestException('Journal entry already reversed');
    }

    // Create reversal entry (swap debit/credit)
    const reversalLines = original.lines.map(line => ({
      accountId: line.accountId,
      type: line.type === 'DEBIT' ? ('CREDIT' as const) : ('DEBIT' as const),
      amount: Number(line.amount),
      narration: `Reversal of ${original.journalNumber}`,
    }));

    const reversalDto: CreateJournalEntryDto = {
      type: JournalType.REVERSAL,
      date: new Date().toISOString(),
      reference: original.journalNumber,
      referenceId: original.id,
      narration: narration || `Reversal of ${original.journalNumber}`,
      lines: reversalLines,
    };

    return this.prisma.$transaction(async tx => {
      // Create reversal journal
      const reversal = await this.createJournal(tenantId, userId, reversalDto);

      // Mark original as reversed
      await tx.journalEntry.update({
        where: { id },
        data: {
          isReversed: true,
          reversalId: reversal.id,
        },
      });

      return reversal;
    });
  }

  // ==================== AUTO POSTING ====================

  async postPurchaseInvoice(
    tenantId: string,
    invoiceId: string,
    data: {
      subtotal: number;
      taxAmount: number;
      total: number;
      vendorName: string;
    },
  ) {
    const existing = await this.findPostedJournal(tenantId, JournalType.PURCHASE_INVOICE, invoiceId);
    if (existing) return existing;

    // Get system accounts
    const [purchaseAccount, taxInputAccount, payableAccount] = await Promise.all([
      this.getSystemAccount(tenantId, '5102'), // Purchase Expense
      this.getSystemAccount(tenantId, '5103'), // Tax Paid (Input)
      this.getSystemAccount(tenantId, '2101'), // Accounts Payable
    ]);

    const lines: { accountId: string; type: 'DEBIT' | 'CREDIT'; amount: number; narration: string }[] = [
      {
        accountId: purchaseAccount.id,
        type: 'DEBIT',
        amount: data.subtotal,
        narration: `Purchase from ${data.vendorName}`,
      },
    ];

    if (data.taxAmount > 0) {
      lines.push({
        accountId: taxInputAccount.id,
        type: 'DEBIT' as const,
        amount: data.taxAmount,
        narration: 'Input tax on purchase',
      });
    }

    lines.push({
      accountId: payableAccount.id,
      type: 'CREDIT' as const,
      amount: data.total,
      narration: `Payable to ${data.vendorName}`,
    });

    return this.createJournal(tenantId, 'SYSTEM', {
      type: JournalType.PURCHASE_INVOICE,
      narration: `Purchase invoice for ${data.vendorName}`,
      reference: `Purchase invoice`,
      referenceId: invoiceId,
      lines,
    });
  }

  async postVendorPayment(
    tenantId: string,
    paymentId: string,
    data: {
      amount: number;
      vendorName: string;
      method: string;
    },
  ) {
    const existing = await this.findPostedJournal(tenantId, JournalType.PURCHASE_PAYMENT, paymentId);
    if (existing) return existing;

    const [payableAccount, cashAccount] = await Promise.all([
      this.getSystemAccount(tenantId, '2101'), // Accounts Payable
      this.getSystemAccount(tenantId, data.method === 'CASH' ? '1101' : '1102'), // Cash or Bank
    ]);

    return this.createJournal(tenantId, 'SYSTEM', {
      type: JournalType.PURCHASE_PAYMENT,
      narration: `Payment to ${data.vendorName}`,
      reference: `Vendor payment`,
      referenceId: paymentId,
      lines: [
        {
          accountId: payableAccount.id,
          type: 'DEBIT',
          amount: data.amount,
          narration: `Payment to ${data.vendorName}`,
        },
        {
          accountId: cashAccount.id,
          type: 'CREDIT',
          amount: data.amount,
          narration: `${data.method} payment`,
        },
      ],
    });
  }

  async postSalesInvoice(
    tenantId: string,
    invoiceId: string,
    data: {
      subtotal: number;
      taxAmount: number;
      total: number;
      customerName: string;
    },
  ) {
    const existing = await this.findPostedJournal(tenantId, JournalType.SALES_INVOICE, invoiceId);
    if (existing) return existing;

    const [receivableAccount, salesAccount, taxOutputAccount] = await Promise.all([
      this.getSystemAccount(tenantId, '1103'), // Accounts Receivable
      this.getSystemAccount(tenantId, '4101'), // Sales Revenue
      this.getSystemAccount(tenantId, '4102'), // Tax Collected (Output)
    ]);

    const lines = [
      {
        accountId: receivableAccount.id,
        type: 'DEBIT' as const,
        amount: data.total,
        narration: `Receivable from ${data.customerName}`,
      },
      {
        accountId: salesAccount.id,
        type: 'CREDIT' as const,
        amount: data.subtotal,
        narration: `Sales to ${data.customerName}`,
      },
    ];

    if (data.taxAmount > 0) {
      lines.push({
        accountId: taxOutputAccount.id,
        type: 'CREDIT' as const,
        amount: data.taxAmount,
        narration: 'Output tax on sales',
      });
    }

    return this.createJournal(tenantId, 'SYSTEM', {
      type: JournalType.SALES_INVOICE,
      narration: `Sales invoice for ${data.customerName}`,
      reference: `Sales invoice`,
      referenceId: invoiceId,
      lines,
    });
  }

  async postCustomerPayment(
    tenantId: string,
    paymentId: string,
    data: {
      amount: number;
      customerName: string;
      method: string;
    },
  ) {
    const existing = await this.findPostedJournal(tenantId, JournalType.SALES_PAYMENT, paymentId);
    if (existing) return existing;

    const [cashAccount, receivableAccount] = await Promise.all([
      this.getSystemAccount(tenantId, data.method === 'CASH' ? '1101' : '1102'), // Cash or Bank
      this.getSystemAccount(tenantId, '1103'), // Accounts Receivable
    ]);

    return this.createJournal(tenantId, 'SYSTEM', {
      type: JournalType.SALES_PAYMENT,
      narration: `Payment from ${data.customerName}`,
      reference: `Customer payment`,
      referenceId: paymentId,
      lines: [
        {
          accountId: cashAccount.id,
          type: 'DEBIT',
          amount: data.amount,
          narration: `${data.method} received`,
        },
        {
          accountId: receivableAccount.id,
          type: 'CREDIT',
          amount: data.amount,
          narration: `Payment from ${data.customerName}`,
        },
      ],
    });
  }

  private async getSystemAccount(tenantId: string, code: string) {
    const aliases: Record<string, string[]> = {
      '1101': ['1101', '1001'],
      '1102': ['1102', '1001'],
      '1103': ['1103', '1002'],
      '2101': ['2101', '2001'],
      '4101': ['4101', '4001'],
      '4102': ['4102', '4001'],
      '5102': ['5102', '5001'],
      '5103': ['5103', '5001'],
    };
    const codes = aliases[code] ?? [code];

    const account = await this.prisma.ledgerAccount.findFirst({
      where: {
        tenantId,
        code: { in: codes },
      },
      orderBy: { code: 'asc' },
    });

    if (!account) {
      throw new NotFoundException(`System account ${code} not found. Please initialize chart of accounts.`);
    }

    return account;
  }

  private async findPostedJournal(tenantId: string, type: JournalType, referenceId: string) {
    return this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        type,
        referenceId,
        isReversed: false,
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
        },
      },
    });
  }
}

