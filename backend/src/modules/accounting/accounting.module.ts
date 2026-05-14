import { Module } from '@nestjs/common';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { JournalController, ReportsController } from './accounting.controller';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { JournalService } from './journal.service';
import { ReportsService } from './reports.service';

@Module({
  controllers: [
    ChartOfAccountsController,
    JournalController,
    ReportsController,
  ],
  providers: [
    ChartOfAccountsService,
    JournalService,
    ReportsService,
  ],
  exports: [
    ChartOfAccountsService,
    JournalService,
    ReportsService,
  ],
})
export class AccountingModule {}

