import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { ReportsService } from './reports.service';
import { CreateJournalEntryDto, QueryJournalDto } from './dto/journal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('journal-entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created successfully' })
  async create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createDto: CreateJournalEntryDto,
  ) {
    return this.journalService.createJournal(tenantId, userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all journal entries' })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved successfully' })
  async findAll(
    @GetTenantId() tenantId: string,
    @Query() queryDto: QueryJournalDto,
  ) {
    return this.journalService.findAllJournals(tenantId, queryDto, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  @ApiResponse({ status: 200, description: 'Journal entry retrieved successfully' })
  async findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.journalService.findJournal(id, tenantId);
  }

  @Post(':id/reverse')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Reverse journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry reversed successfully' })
  async reverse(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body('narration') narration: string,
  ) {
    return this.journalService.reverseJournal(id, tenantId, userId, narration);
  }
}

@ApiTags('financial-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance' })
  @ApiResponse({ status: 200, description: 'Trial balance retrieved successfully' })
  getTrialBalance(
    @GetTenantId() tenantId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const date = asOfDate ? new Date(asOfDate) : undefined;
    return this.reportsService.getTrialBalance(tenantId, date);
  }

  @Get('profit-and-loss')
  @ApiOperation({ summary: 'Get profit & loss statement' })
  @ApiResponse({ status: 200, description: 'P&L statement retrieved successfully' })
  getProfitAndLoss(
    @GetTenantId() tenantId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getProfitAndLoss(
      tenantId,
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet' })
  @ApiResponse({ status: 200, description: 'Balance sheet retrieved successfully' })
  getBalanceSheet(
    @GetTenantId() tenantId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const date = asOfDate ? new Date(asOfDate) : undefined;
    return this.reportsService.getBalanceSheet(tenantId, date);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow statement' })
  @ApiResponse({ status: 200, description: 'Cash flow statement retrieved successfully' })
  getCashFlow(
    @GetTenantId() tenantId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getCashFlow(
      tenantId,
      new Date(fromDate),
      new Date(toDate),
    );
  }
}

