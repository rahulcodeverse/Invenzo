import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
  CreateLedgerAccountDto,
  UpdateLedgerAccountDto,
} from './dto/chart-of-accounts.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { AccountType, AccountSubType } from '@prisma/client';

@Injectable()
export class ChartOfAccountsService {
  constructor(private prisma: PrismaService) {}

  // ==================== ACCOUNT GROUPS ====================

  async createGroup(tenantId: string, createDto: CreateAccountGroupDto) {
    // Check code uniqueness
    const existing = await this.prisma.accountGroup.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: createDto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Account group code already exists');
    }

    // Verify parent if provided
    if (createDto.parentId) {
      const parent = await this.prisma.accountGroup.findFirst({
        where: { id: createDto.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Parent group not found');
      }
    }

    return this.prisma.accountGroup.create({
      data: {
        ...createDto,
        tenantId,
        type: createDto.type,
      },
    });
  }

  async findAllGroups(tenantId: string, type?: AccountType) {
    const where: any = { tenantId };
    if (type) {
      where.type = type;
    }

    const groups = await this.prisma.accountGroup.findMany({
      where,
      include: {
        children: true,
        _count: {
          select: {
            accounts: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return groups;
  }

  async findGroupTree(tenantId: string) {
    const allGroups = await this.prisma.accountGroup.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            accounts: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Build tree structure
    const groupMap = new Map(allGroups.map(g => [g.id, { ...g, children: [] as any[] }]));
    const tree: any[] = [];

    allGroups.forEach(group => {
      if (group.parentId && groupMap.has(group.parentId)) {
        groupMap.get(group.parentId)!.children.push(groupMap.get(group.id) as any);
      } else {
        tree.push(groupMap.get(group.id));
      }
    });

    return tree;
  }

  async updateGroup(id: string, tenantId: string, updateDto: UpdateAccountGroupDto) {
    const existing = await this.prisma.accountGroup.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Account group not found');
    }

    if (existing.isSystem) {
      throw new ConflictException('Cannot modify system account group');
    }

    return this.prisma.accountGroup.update({
      where: { id },
      data: updateDto,
    });
  }

  // ==================== LEDGER ACCOUNTS ====================

  async createAccount(tenantId: string, createDto: CreateLedgerAccountDto) {
    // Check code uniqueness
    const existing = await this.prisma.ledgerAccount.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: createDto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Account code already exists');
    }

    // Verify group
    const group = await this.prisma.accountGroup.findFirst({
      where: { id: createDto.groupId, tenantId },
    });

    if (!group) {
      throw new NotFoundException('Account group not found');
    }

    return this.prisma.ledgerAccount.create({
      data: {
        ...createDto,
        tenantId,
        type: group.type,
        subType: group.subType,
        currentBalance: createDto.openingBalance || 0,
      },
      include: {
        group: true,
      },
    });
  }

  async findAllAccounts(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 100, search, sortBy = 'code', sortOrder = 'asc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [accounts, total] = await Promise.all([
      this.prisma.ledgerAccount.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          group: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.ledgerAccount.count({ where }),
    ]);

    return PaginationHelper.paginate(accounts, total, page, limit);
  }

  async findAccount(id: string, tenantId: string) {
    const account = await this.prisma.ledgerAccount.findFirst({
      where: { id, tenantId },
      include: {
        group: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(id: string, tenantId: string, updateDto: UpdateLedgerAccountDto) {
    const existing = await this.findAccount(id, tenantId);

    if (existing.isSystem) {
      throw new ConflictException('Cannot modify system account');
    }

    return this.prisma.ledgerAccount.update({
      where: { id },
      data: updateDto,
    });
  }

  async getAccountBalance(id: string, tenantId: string) {
    const account = await this.findAccount(id, tenantId);

    // Calculate balance from journal lines
    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId: id,
        journal: {
          tenantId,
        },
      },
    });

    const debits = lines
      .filter(l => l.type === 'DEBIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);

    const credits = lines
      .filter(l => l.type === 'CREDIT')
      .reduce((sum, l) => sum + Number(l.amount), 0);

    // Balance calculation based on account type
    let balance = Number(account.openingBalance);
    if (['ASSET', 'EXPENSE'].includes(account.type)) {
      balance += debits - credits;
    } else {
      balance += credits - debits;
    }

    return {
      account: {
        id: account.id,
        name: account.name,
        code: account.code,
        type: account.type,
      },
      openingBalance: Number(account.openingBalance),
      totalDebits: debits,
      totalCredits: credits,
      currentBalance: balance,
    };
  }

  async getAccountStatement(
    id: string,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ) {
    const account = await this.findAccount(id, tenantId);

    const where: any = {
      accountId: id,
      journal: {
        tenantId,
      },
    };

    if (fromDate || toDate) {
      where.journal.date = {};
      if (fromDate) where.journal.date.gte = fromDate;
      if (toDate) where.journal.date.lte = toDate;
    }

    const lines = await this.prisma.journalLine.findMany({
      where,
      include: {
        journal: {
          select: {
            journalNumber: true,
            date: true,
            narration: true,
            reference: true,
          },
        },
      },
      orderBy: {
        journal: {
          date: 'asc',
        },
      },
    });

    // Calculate running balance
    let runningBalance = Number(account.openingBalance);
    const transactions = lines.map(line => {
      const isDebit = line.type === 'DEBIT';
      const amount = Number(line.amount);

      if (['ASSET', 'EXPENSE'].includes(account.type)) {
        runningBalance += isDebit ? amount : -amount;
      } else {
        runningBalance += isDebit ? -amount : amount;
      }

      return {
        date: line.journal.date,
        journalNumber: line.journal.journalNumber,
        narration: line.narration || line.journal.narration,
        reference: line.journal.reference,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        balance: runningBalance,
      };
    });

    return {
      account: {
        id: account.id,
        name: account.name,
        code: account.code,
        type: account.type,
      },
      openingBalance: Number(account.openingBalance),
      transactions,
      closingBalance: runningBalance,
    };
  }

  // ==================== DEFAULT CHART INITIALIZATION ====================

  async initializeDefaultChart(tenantId: string) {
    // Check if already initialized
    const existing = await this.prisma.accountGroup.count({ where: { tenantId } });
    if (existing > 0) {
      throw new ConflictException('Chart of accounts already initialized');
    }

    return this.prisma.$transaction(async tx => {
      // Create account groups
      const groups = await this.createDefaultGroups(tx, tenantId);

      // Create default ledger accounts
      await this.createDefaultAccounts(tx, tenantId, groups);

      return { message: 'Default chart of accounts created successfully' };
    });
  }

  private async createDefaultGroups(tx: any, tenantId: string) {
    const groups: any = {};

    // Assets
    groups.assets = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Assets',
        code: '1000',
        type: 'ASSET',
        isSystem: true,
      },
    });

    groups.currentAssets = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Current Assets',
        code: '1100',
        type: 'ASSET',
        subType: 'CURRENT_ASSET',
        parentId: groups.assets.id,
        isSystem: true,
      },
    });

    // Liabilities
    groups.liabilities = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Liabilities',
        code: '2000',
        type: 'LIABILITY',
        isSystem: true,
      },
    });

    groups.currentLiabilities = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Current Liabilities',
        code: '2100',
        type: 'LIABILITY',
        subType: 'CURRENT_LIABILITY',
        parentId: groups.liabilities.id,
        isSystem: true,
      },
    });

    // Equity
    groups.equity = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Equity',
        code: '3000',
        type: 'EQUITY',
        isSystem: true,
      },
    });

    // Income
    groups.income = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Income',
        code: '4000',
        type: 'INCOME',
        isSystem: true,
      },
    });

    // Expenses
    groups.expenses = await tx.accountGroup.create({
      data: {
        tenantId,
        name: 'Expenses',
        code: '5000',
        type: 'EXPENSE',
        isSystem: true,
      },
    });

    return groups;
  }

  private async createDefaultAccounts(tx: any, tenantId: string, groups: any) {
    // Current Assets
    await tx.ledgerAccount.createMany({
      data: [
        {
          tenantId,
          groupId: groups.currentAssets.id,
          name: 'Cash',
          code: '1101',
          type: 'ASSET',
          subType: 'CURRENT_ASSET',
          description: 'Cash in hand',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.currentAssets.id,
          name: 'Bank',
          code: '1102',
          type: 'ASSET',
          subType: 'CURRENT_ASSET',
          description: 'Bank accounts',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.currentAssets.id,
          name: 'Accounts Receivable',
          code: '1103',
          type: 'ASSET',
          subType: 'CURRENT_ASSET',
          description: 'Customer receivables',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.currentAssets.id,
          name: 'Inventory',
          code: '1104',
          type: 'ASSET',
          subType: 'CURRENT_ASSET',
          description: 'Stock inventory',
          isSystem: true,
        },
      ],
    });

    // Current Liabilities
    await tx.ledgerAccount.createMany({
      data: [
        {
          tenantId,
          groupId: groups.currentLiabilities.id,
          name: 'Accounts Payable',
          code: '2101',
          type: 'LIABILITY',
          subType: 'CURRENT_LIABILITY',
          description: 'Vendor payables',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.currentLiabilities.id,
          name: 'Tax Payable',
          code: '2102',
          type: 'LIABILITY',
          subType: 'CURRENT_LIABILITY',
          description: 'GST and other taxes payable',
          isSystem: true,
        },
      ],
    });

    // Equity
    await tx.ledgerAccount.createMany({
      data: [
        {
          tenantId,
          groupId: groups.equity.id,
          name: 'Owner\'s Capital',
          code: '3101',
          type: 'EQUITY',
          subType: 'OWNERS_EQUITY',
          description: 'Owner\'s equity',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.equity.id,
          name: 'Retained Earnings',
          code: '3102',
          type: 'EQUITY',
          subType: 'RETAINED_EARNINGS',
          description: 'Accumulated profits',
          isSystem: true,
        },
      ],
    });

    // Income
    await tx.ledgerAccount.createMany({
      data: [
        {
          tenantId,
          groupId: groups.income.id,
          name: 'Sales Revenue',
          code: '4101',
          type: 'INCOME',
          subType: 'SALES_REVENUE',
          description: 'Revenue from sales',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.income.id,
          name: 'Tax Collected (Output)',
          code: '4102',
          type: 'INCOME',
          subType: 'OTHER_INCOME',
          description: 'GST collected on sales',
          isSystem: true,
        },
      ],
    });

    // Expenses
    await tx.ledgerAccount.createMany({
      data: [
        {
          tenantId,
          groupId: groups.expenses.id,
          name: 'Cost of Goods Sold',
          code: '5101',
          type: 'EXPENSE',
          subType: 'COST_OF_GOODS_SOLD',
          description: 'Direct cost of goods sold',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.expenses.id,
          name: 'Purchase Expense',
          code: '5102',
          type: 'EXPENSE',
          subType: 'OPERATING_EXPENSE',
          description: 'Purchase of goods',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.expenses.id,
          name: 'Tax Paid (Input)',
          code: '5103',
          type: 'EXPENSE',
          subType: 'OPERATING_EXPENSE',
          description: 'GST paid on purchases',
          isSystem: true,
        },
        {
          tenantId,
          groupId: groups.expenses.id,
          name: 'Discount Given',
          code: '5104',
          type: 'EXPENSE',
          subType: 'OPERATING_EXPENSE',
          description: 'Discounts given to customers',
          isSystem: true,
        },
      ],
    });
  }
}

