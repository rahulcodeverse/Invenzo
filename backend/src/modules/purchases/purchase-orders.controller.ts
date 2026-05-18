import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, PurchaseOrderQueryDto } from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases/po')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully' })
  async create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createPoDto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(tenantId, userId, createPoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiResponse({ status: 200, description: 'Purchase orders retrieved successfully' })
  async findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PurchaseOrderQueryDto) {
    return this.purchaseOrdersService.findAll(tenantId, paginationDto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending purchase orders (not fully received)' })
  @ApiResponse({ status: 200, description: 'Pending POs retrieved successfully' })
  async getPending(@GetTenantId() tenantId: string) {
    return this.purchaseOrdersService.getPendingPos(tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download purchase order PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.createPurchaseOrderPdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="purchase-order-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({ status: 200, description: 'Purchase order retrieved successfully' })
  async findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.purchaseOrdersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order updated successfully' })
  async update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() updatePoDto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, tenantId, updatePoDto, userId);
  }

  @Post(':id/approve')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Approve purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order approved successfully' })
  async approve(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.approve(id, tenantId, userId);
  }

  @Post(':id/cancel')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Cancel purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled successfully' })
  async cancel(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.cancel(id, tenantId, userId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order deleted successfully' })
  async remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.purchaseOrdersService.remove(id, tenantId);
  }
}

