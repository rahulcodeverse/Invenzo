import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTrialBalance(tenantId: string, asOfDate?: Date) {
    const where: any = {
      tenantId,
      isActive: true,
    };

    // Get all accounts with balances
    const accounts = await this.prisma.ledgerAccount.findMany({
      where,
      include: {
        group: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // If date specified, calculate balances from journal lines
    let accountBalances = accounts.map(acc => ({
      code: acc.code,
      name: acc.name,
      group: acc.group.name,
      type: acc.type,
      debit: 0,
      credit: 0,
    }));

    if (asOfDate) {
      // Calculate from journal lines
      for (const account of accounts) {
        const lines = await this.prisma.journalLine.findMany({
          where: {
            accountId: account.id,
            journal: {
              tenantId,
              date: { lte: asOfDate },
            },
          },
        });

        const debits = lines
          .filter(l => l.type === 'DEBIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        const credits = lines
          .filter(l => l.type === 'CREDIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        let balance = Number(account.openingBalance);
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
          balance += debits - credits;
        } else {
          balance += credits - debits;
        }

        const accBalance = accountBalances.find(ab => ab.code === account.code)!;
        if (balance >= 0) {
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            accBalance.debit = balance;
          } else {
            accBalance.credit = balance;
          }
        } else {
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            accBalance.credit = Math.abs(balance);
          } else {
            accBalance.debit = Math.abs(balance);
          }
        }
      }
    } else {
      // Use current balances
      accountBalances = accounts.map(acc => {
        const balance = Number(acc.currentBalance);
        return {
          code: acc.code,
          name: acc.name,
          group: acc.group.name,
          type: acc.type,
          debit: balance >= 0 && ['ASSET', 'EXPENSE'].includes(acc.type) ? balance : 0,
          credit: balance >= 0 && ['LIABILITY', 'EQUITY', 'INCOME'].includes(acc.type) ? balance : 0,
        };
      });
    }

    const totalDebit = accountBalances.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = accountBalances.reduce((sum, acc) => sum + acc.credit, 0);

    return {
      asOfDate: asOfDate || new Date(),
      accounts: accountBalances.filter(acc => acc.debit > 0 || acc.credit > 0),
      totalDebit,
      totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
    };
  }

  async getProfitAndLoss(tenantId: string, fromDate: Date, toDate: Date) {
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: {
        tenantId,
        type: { in: ['INCOME', 'EXPENSE'] },
        isActive: true,
      },
      include: {
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const accountData = await Promise.all(
      accounts.map(async account => {
        const lines = await this.prisma.journalLine.findMany({
          where: {
            accountId: account.id,
            journal: {
              tenantId,
              date: {
                gte: fromDate,
                lte: toDate,
              },
            },
          },
        });

        const debits = lines
          .filter(l => l.type === 'DEBIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        const credits = lines
          .filter(l => l.type === 'CREDIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        // For Income: Credit - Debit
        // For Expense: Debit - Credit
        const amount = account.type === 'INCOME' ? credits - debits : debits - credits;

        return {
          code: account.code,
          name: account.name,
          group: account.group.name,
          type: account.type,
          amount,
        };
      }),
    );

    const income = accountData.filter(acc => acc.type === 'INCOME' && acc.amount > 0);
    const expenses = accountData.filter(acc => acc.type === 'EXPENSE' && acc.amount > 0);

    const totalIncome = income.reduce((sum, acc) => sum + acc.amount, 0);
    const totalExpense = expenses.reduce((sum, acc) => sum + acc.amount, 0);
    const netProfit = totalIncome - totalExpense;

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      income,
      totalIncome,
      expenses,
      totalExpense,
      netProfit,
      netLoss: netProfit < 0 ? Math.abs(netProfit) : 0,
    };
  }

  async getBalanceSheet(tenantId: string, asOfDate?: Date) {
    const date = asOfDate || new Date();

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: {
        tenantId,
        type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
        isActive: true,
      },
      include: {
        group: {
          select: {
            name: true,
            subType: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const accountData = await Promise.all(
      accounts.map(async account => {
        const lines = await this.prisma.journalLine.findMany({
          where: {
            accountId: account.id,
            journal: {
              tenantId,
              date: { lte: date },
            },
          },
        });

        const debits = lines
          .filter(l => l.type === 'DEBIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        const credits = lines
          .filter(l => l.type === 'CREDIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        let balance = Number(account.openingBalance);
        if (account.type === 'ASSET') {
          balance += debits - credits;
        } else {
          balance += credits - debits;
        }

        return {
          code: account.code,
          name: account.name,
          group: account.group.name,
          subType: account.group.subType,
          type: account.type,
          balance,
        };
      }),
    );

    const assets = accountData
      .filter(acc => acc.type === 'ASSET' && acc.balance > 0)
      .sort((a, b) => {
        const order = ['CURRENT_ASSET', 'FIXED_ASSET'];
        return order.indexOf(a.subType!) - order.indexOf(b.subType!);
      });

    const liabilities = accountData
      .filter(acc => acc.type === 'LIABILITY' && acc.balance > 0)
      .sort((a, b) => {
        const order = ['CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'];
        return order.indexOf(a.subType!) - order.indexOf(b.subType!);
      });

    const equity = accountData.filter(acc => acc.type === 'EQUITY' && acc.balance > 0);

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      asOfDate: date,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  async getCashFlow(tenantId: string, fromDate: Date, toDate: Date) {
    // Simple cash flow: track Cash and Bank accounts
    const cashAccounts = await this.prisma.ledgerAccount.findMany({
      where: {
        tenantId,
        code: { in: ['1101', '1102'] }, // Cash and Bank
      },
    });

    const cashFlows = await Promise.all(
      cashAccounts.map(async account => {
        const lines = await this.prisma.journalLine.findMany({
          where: {
            accountId: account.id,
            journal: {
              tenantId,
              date: {
                gte: fromDate,
                lte: toDate,
              },
            },
          },
          include: {
            journal: {
              select: {
                date: true,
                narration: true,
                type: true,
              },
            },
          },
          orderBy: {
            journal: {
              date: 'asc',
            },
          },
        });

        const debits = lines
          .filter(l => l.type === 'DEBIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        const credits = lines
          .filter(l => l.type === 'CREDIT')
          .reduce((sum, l) => sum + Number(l.amount), 0);

        return {
          account: account.name,
          code: account.code,
          openingBalance: Number(account.openingBalance),
          cashIn: debits,
          cashOut: credits,
          netFlow: debits - credits,
          closingBalance: Number(account.openingBalance) + debits - credits,
          transactions: lines.map(l => ({
            date: l.journal.date,
            narration: l.narration || l.journal.narration,
            type: l.journal.type,
            inflow: l.type === 'DEBIT' ? Number(l.amount) : 0,
            outflow: l.type === 'CREDIT' ? Number(l.amount) : 0,
          })),
        };
      }),
    );

    const totalCashIn = cashFlows.reduce((sum, cf) => sum + cf.cashIn, 0);
    const totalCashOut = cashFlows.reduce((sum, cf) => sum + cf.cashOut, 0);

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      accounts: cashFlows,
      totalCashIn,
      totalCashOut,
      netCashFlow: totalCashIn - totalCashOut,
    };
  }
}

