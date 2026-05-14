import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { KpiService } from './kpi.service';
import { SalesAnalyticsService } from './sales-analytics.service';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import {
  DateRangeDto,
  TrendQueryDto,
  LimitDto,
  DateRangeLimitDto,
  DeadStockQueryDto,
  ExpiryQueryDto,
} from './dto/reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('kpi-dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get summary KPIs for dashboard' })
  @ApiResponse({ status: 200, description: 'Summary KPIs retrieved successfully' })
  getSummary(@GetTenantId() tenantId: string) {
    return this.kpiService.getSummaryKpis(tenantId);
  }

  @Get('finance')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get financial KPIs' })
  @ApiResponse({ status: 200, description: 'Financial KPIs retrieved successfully' })
  getFinance(@GetTenantId() tenantId: string, @Query() dateRange: DateRangeDto) {
    const fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = dateRange.toDate ? new Date(dateRange.toDate) : new Date();
    return this.kpiService.getFinanceKpis(tenantId, fromDate, toDate);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory KPIs' })
  @ApiResponse({ status: 200, description: 'Inventory KPIs retrieved successfully' })
  getInventory(@GetTenantId() tenantId: string) {
    return this.kpiService.getInventoryKpis(tenantId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({ status: 200, description: 'Top products retrieved successfully' })
  getTopProducts(@GetTenantId() tenantId: string, @Query() limitDto: LimitDto) {
    return this.kpiService.getTopProducts(tenantId, limitDto.limit || 10);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Get top customers by revenue' })
  @ApiResponse({ status: 200, description: 'Top customers retrieved successfully' })
  getTopCustomers(@GetTenantId() tenantId: string, @Query() limitDto: LimitDto) {
    return this.kpiService.getTopCustomers(tenantId, limitDto.limit || 10);
  }

  @Get('top-vendors')
  @ApiOperation({ summary: 'Get top vendors by purchase volume' })
  @ApiResponse({ status: 200, description: 'Top vendors retrieved successfully' })
  getTopVendors(@GetTenantId() tenantId: string, @Query() limitDto: LimitDto) {
    return this.kpiService.getTopVendors(tenantId, limitDto.limit || 10);
  }
}

@ApiTags('sales-analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/sales')
export class SalesAnalyticsController {
  constructor(private readonly salesService: SalesAnalyticsService) {}

  @Get('trend')
  @ApiOperation({ summary: 'Get sales trend over time' })
  @ApiResponse({ status: 200, description: 'Sales trend retrieved successfully' })
  getTrend(@GetTenantId() tenantId: string, @Query() query: TrendQueryDto) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();
    return this.salesService.getSalesTrend(tenantId, fromDate, toDate, query.groupBy || 'day');
  }

  @Get('products')
  @ApiOperation({ summary: 'Get product-wise sales analysis' })
  @ApiResponse({ status: 200, description: 'Product sales analysis retrieved successfully' })
  getProductWise(
    @GetTenantId() tenantId: string,
    @Query() query: DateRangeLimitDto,
  ) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();
    return this.salesService.getProductWiseSales(tenantId, fromDate, toDate, query.limit || 50);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category-wise sales analysis' })
  @ApiResponse({ status: 200, description: 'Category sales analysis retrieved successfully' })
  getCategoryWise(@GetTenantId() tenantId: string, @Query() dateRange: DateRangeDto) {
    const fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = dateRange.toDate ? new Date(dateRange.toDate) : new Date();
    return this.salesService.getCategoryWiseSales(tenantId, fromDate, toDate);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer-wise sales analysis' })
  @ApiResponse({ status: 200, description: 'Customer sales analysis retrieved successfully' })
  getCustomerWise(
    @GetTenantId() tenantId: string,
    @Query() query: DateRangeLimitDto,
  ) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();
    return this.salesService.getCustomerWiseSales(tenantId, fromDate, toDate, query.limit || 50);
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get sales growth comparison (MoM)' })
  @ApiResponse({ status: 200, description: 'Sales growth retrieved successfully' })
  getGrowth(@GetTenantId() tenantId: string) {
    return this.salesService.getSalesGrowth(tenantId);
  }
}

@ApiTags('inventory-analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/inventory')
export class InventoryAnalyticsController {
  constructor(private readonly inventoryService: InventoryAnalyticsService) {}

  @Get('ageing')
  @ApiOperation({ summary: 'Get stock ageing report' })
  @ApiResponse({ status: 200, description: 'Stock ageing report retrieved successfully' })
  getAgeing(@GetTenantId() tenantId: string) {
    return this.inventoryService.getStockAgeing(tenantId);
  }

  @Get('dead-stock')
  @ApiOperation({ summary: 'Get dead stock report (slow-moving items)' })
  @ApiResponse({ status: 200, description: 'Dead stock report retrieved successfully' })
  getDeadStock(@GetTenantId() tenantId: string, @Query() query: DeadStockQueryDto) {
    return this.inventoryService.getDeadStock(tenantId, query.daysSinceLastMovement || 90);
  }

  @Get('reorder')
  @ApiOperation({ summary: 'Get reorder suggestions' })
  @ApiResponse({ status: 200, description: 'Reorder suggestions retrieved successfully' })
  getReorder(@GetTenantId() tenantId: string) {
    return this.inventoryService.getReorderSuggestions(tenantId);
  }

  @Get('expiry')
  @ApiOperation({ summary: 'Get batch expiry report' })
  @ApiResponse({ status: 200, description: 'Batch expiry report retrieved successfully' })
  getExpiry(@GetTenantId() tenantId: string, @Query() query: ExpiryQueryDto) {
    return this.inventoryService.getBatchExpiryReport(tenantId, query.daysUntilExpiry || 30);
  }

  @Get('warehouse-wise')
  @ApiOperation({ summary: 'Get warehouse-wise stock summary' })
  @ApiResponse({ status: 200, description: 'Warehouse stock summary retrieved successfully' })
  getWarehouseWise(@GetTenantId() tenantId: string) {
    return this.inventoryService.getWarehouseWiseStock(tenantId);
  }

  @Get('turnover')
  @ApiOperation({ summary: 'Get stock turnover ratio' })
  @ApiResponse({ status: 200, description: 'Stock turnover ratio retrieved successfully' })
  getTurnover(@GetTenantId() tenantId: string, @Query() dateRange: DateRangeDto) {
    const fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = dateRange.toDate ? new Date(dateRange.toDate) : new Date();
    return this.inventoryService.getStockTurnoverRatio(tenantId, fromDate, toDate);
  }
}

