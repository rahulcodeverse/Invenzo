import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ManufacturingService } from './manufacturing.service';
import {
  CreateBomDto,
  CreatePurchaseIndentsDto,
  CreateWorkOrderDto,
  MrpQueryDto,
  UpdateBomDto,
  UpdatePurchaseIndentDto,
  UpdateWorkOrderDto,
} from './dto/manufacturing.dto';

@ApiTags('manufacturing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manufacturing')
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get production summary' })
  summary(@GetTenantId() tenantId: string) {
    return this.manufacturingService.getProductionSummary(tenantId);
  }

  @Get('mrp')
  @ApiOperation({ summary: 'Calculate material requirements from sales orders and BOMs' })
  calculateMrp(@GetTenantId() tenantId: string, @Query() query: MrpQueryDto) {
    return this.manufacturingService.calculateMrp(tenantId, query.requiredBy);
  }

  @Get('indents')
  @ApiOperation({ summary: 'List purchase indents generated from MRP' })
  findPurchaseIndents(@GetTenantId() tenantId: string, @Query() pagination: PaginationDto) {
    return this.manufacturingService.findPurchaseIndents(tenantId, pagination);
  }

  @Post('indents/generate')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Generate purchase indents from current MRP shortages' })
  generatePurchaseIndents(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreatePurchaseIndentsDto,
  ) {
    return this.manufacturingService.createPurchaseIndentsFromMrp(tenantId, userId, dto);
  }

  @Patch('indents/:id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update purchase indent status' })
  updatePurchaseIndent(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() dto: UpdatePurchaseIndentDto,
  ) {
    return this.manufacturingService.updatePurchaseIndent(id, tenantId, dto);
  }

  @Post('boms')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create bill of material' })
  createBom(@GetTenantId() tenantId: string, @GetUser('id') userId: string, @Body() dto: CreateBomDto) {
    return this.manufacturingService.createBom(tenantId, userId, dto);
  }

  @Get('boms')
  @ApiOperation({ summary: 'List bills of material' })
  findBoms(@GetTenantId() tenantId: string, @Query() pagination: PaginationDto) {
    return this.manufacturingService.findBoms(tenantId, pagination);
  }

  @Get('boms/:id')
  @ApiOperation({ summary: 'Get bill of material' })
  findBom(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.manufacturingService.findBom(id, tenantId);
  }

  @Patch('boms/:id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update bill of material' })
  updateBom(@Param('id') id: string, @GetTenantId() tenantId: string, @Body() dto: UpdateBomDto) {
    return this.manufacturingService.updateBom(id, tenantId, dto);
  }

  @Post('work-orders')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create work order from BOM' })
  createWorkOrder(@GetTenantId() tenantId: string, @GetUser('id') userId: string, @Body() dto: CreateWorkOrderDto) {
    return this.manufacturingService.createWorkOrder(tenantId, userId, dto);
  }

  @Get('work-orders')
  @ApiOperation({ summary: 'List work orders' })
  findWorkOrders(@GetTenantId() tenantId: string, @Query() pagination: PaginationDto) {
    return this.manufacturingService.findWorkOrders(tenantId, pagination);
  }

  @Patch('work-orders/:id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update work order production status' })
  updateWorkOrder(@Param('id') id: string, @GetTenantId() tenantId: string, @Body() dto: UpdateWorkOrderDto) {
    return this.manufacturingService.updateWorkOrder(id, tenantId, dto);
  }
}
