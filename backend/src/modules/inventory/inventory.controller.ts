import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  StockInDto,
  StockOutDto,
  StockTransferDto,
  StockAdjustmentDto,
} from './dto/inventory.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { MovementsQueryDto } from './dto/movements-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('in')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Add stock (Stock IN operation)' })
  @ApiResponse({ status: 201, description: 'Stock added successfully' })
  stockIn(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() stockInDto: StockInDto,
  ) {
    return this.inventoryService.stockIn(tenantId, userId, stockInDto);
  }

  @Post('out')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Remove stock (Stock OUT operation)' })
  @ApiResponse({ status: 201, description: 'Stock removed successfully' })
  stockOut(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() stockOutDto: StockOutDto,
  ) {
    return this.inventoryService.stockOut(tenantId, userId, stockOutDto);
  }

  @Post('transfer')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({ status: 201, description: 'Stock transferred successfully' })
  stockTransfer(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() transferDto: StockTransferDto,
  ) {
    return this.inventoryService.stockTransfer(tenantId, userId, transferDto);
  }

  @Post('adjust')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Adjust stock (for corrections, damage, etc.)' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  stockAdjustment(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() adjustmentDto: StockAdjustmentDto,
  ) {
    return this.inventoryService.stockAdjustment(tenantId, userId, adjustmentDto);
  }

  @Get('stock/:productId')
  @ApiOperation({ summary: 'Get stock details for a product' })
  @ApiResponse({ status: 200, description: 'Stock details retrieved successfully' })
  getProductStock(@Param('productId') productId: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.getProductStock(productId, tenantId);
  }

  @Get('movements/summary')
  @ApiOperation({ summary: 'Get stock movements summary statistics' })
  @ApiResponse({ status: 200, description: 'Movements summary retrieved successfully' })
  getMovementsSummary(@GetTenantId() tenantId: string, @Query() queryDto: MovementsQueryDto) {
    return this.inventoryService.getMovementsSummary(tenantId, queryDto);
  }

  @Get('movements/export/csv')
  @ApiOperation({ summary: 'Export stock movements to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file generated successfully' })
  async exportMovementsCSV(
    @GetTenantId() tenantId: string,
    @Query() queryDto: MovementsQueryDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.inventoryService.exportMovementsCSV(tenantId, queryDto);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return result.data;
  }

  @Get('movements/export/excel')
  @ApiOperation({ summary: 'Export stock movements to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file generated successfully' })
  async exportMovementsExcel(
    @GetTenantId() tenantId: string,
    @Query() queryDto: MovementsQueryDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.inventoryService.exportMovementsExcel(tenantId, queryDto);
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return result.data;
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get stock movements history with advanced filters' })
  @ApiResponse({ status: 200, description: 'Stock movements retrieved successfully' })
  getStockMovements(@GetTenantId() tenantId: string, @Query() queryDto: MovementsQueryDto) {
    return this.inventoryService.getStockMovements(tenantId, queryDto);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Get all stock levels' })
  @ApiResponse({ status: 200, description: 'Stock levels retrieved successfully' })
  getAllStock(@GetTenantId() tenantId: string, @Query() stockQueryDto: StockQueryDto) {
    return this.inventoryService.getAllStock(tenantId, stockQueryDto);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring batches' })
  @ApiQuery({ name: 'days', required: false, description: 'Days until expiry (default: 30)' })
  @ApiResponse({ status: 200, description: 'Expiring batches retrieved successfully' })
  getExpiringBatches(
    @GetTenantId() tenantId: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.inventoryService.getExpiringBatches(tenantId, days);
  }
}

