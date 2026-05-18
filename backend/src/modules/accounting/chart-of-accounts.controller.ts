import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import {
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
  CreateLedgerAccountDto,
  UpdateLedgerAccountDto,
} from './dto/chart-of-accounts.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { AccountType } from '@prisma/client';

@ApiTags('chart-of-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting/chart')
export class ChartOfAccountsController {
  constructor(private readonly chartService: ChartOfAccountsService) {}

  // ==================== ACCOUNT GROUPS ====================

  @Post('groups')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create account group' })
  @ApiResponse({ status: 201, description: 'Account group created successfully' })
  createGroup(@GetTenantId() tenantId: string, @Body() createDto: CreateAccountGroupDto) {
    return this.chartService.createGroup(tenantId, createDto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all account groups' })
  @ApiResponse({ status: 200, description: 'Account groups retrieved successfully' })
  findAllGroups(
    @GetTenantId() tenantId: string,
    @Query('type') type?: AccountType,
  ) {
    return this.chartService.findAllGroups(tenantId, type);
  }

  @Get('groups/tree')
  @ApiOperation({ summary: 'Get account groups as tree structure' })
  @ApiResponse({ status: 200, description: 'Account groups tree retrieved successfully' })
  findGroupTree(@GetTenantId() tenantId: string) {
    return this.chartService.findGroupTree(tenantId);
  }

  @Patch('groups/:id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update account group' })
  @ApiResponse({ status: 200, description: 'Account group updated successfully' })
  updateGroup(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateAccountGroupDto,
  ) {
    return this.chartService.updateGroup(id, tenantId, updateDto);
  }

  // ==================== LEDGER ACCOUNTS ====================

  @Post('accounts')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create ledger account' })
  @ApiResponse({ status: 201, description: 'Ledger account created successfully' })
  async createAccount(@GetTenantId() tenantId: string, @Body() createDto: CreateLedgerAccountDto) {
    return this.chartService.createAccount(tenantId, createDto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all ledger accounts' })
  @ApiResponse({ status: 200, description: 'Ledger accounts retrieved successfully' })
  async findAllAccounts(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.chartService.findAllAccounts(tenantId, paginationDto);
  }

  @Get('accounts/:id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  async getAccountBalance(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.chartService.getAccountBalance(id, tenantId);
  }

  @Get('accounts/:id/statement')
  @ApiOperation({ summary: 'Get account statement' })
  @ApiResponse({ status: 200, description: 'Account statement retrieved successfully' })
  async getAccountStatement(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    return this.chartService.getAccountStatement(id, tenantId, from, to);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get ledger account by ID' })
  @ApiResponse({ status: 200, description: 'Ledger account retrieved successfully' })
  async findAccount(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.chartService.findAccount(id, tenantId);
  }

  @Patch('accounts/:id')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Update ledger account' })
  @ApiResponse({ status: 200, description: 'Ledger account updated successfully' })
  async updateAccount(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateLedgerAccountDto,
  ) {
    return this.chartService.updateAccount(id, tenantId, updateDto);
  }

  // ==================== INITIALIZATION ====================

  @Post('initialize')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Initialize default chart of accounts' })
  @ApiResponse({ status: 201, description: 'Default chart of accounts created successfully' })
  async initializeDefaultChart(@GetTenantId() tenantId: string) {
    return this.chartService.initializeDefaultChart(tenantId);
  }
}

