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
import { QuotationsService } from './quotations.service';
import { SalesOrdersService } from './sales-orders.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesDocumentQueryDto,
} from './dto/quotation-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales/quotations')
export class QuotationsController {
  constructor(
    private readonly quotationsService: QuotationsService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create quotation' })
  @ApiResponse({ status: 201, description: 'Quotation created successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createQuotationDto: CreateQuotationDto,
  ) {
    return this.quotationsService.create(tenantId, userId, createQuotationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotations' })
  @ApiResponse({ status: 200, description: 'Quotations retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() queryDto: SalesDocumentQueryDto) {
    return this.quotationsService.findAll(tenantId, queryDto);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download quotation PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.createQuotationPdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by ID' })
  @ApiResponse({ status: 200, description: 'Quotation retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.quotationsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update quotation' })
  @ApiResponse({ status: 200, description: 'Quotation updated successfully' })
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ) {
    return this.quotationsService.update(id, tenantId, updateQuotationDto);
  }

  @Post(':id/convert')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Convert quotation to sales order' })
  @ApiResponse({ status: 200, description: 'Converted to sales order successfully' })
  convertToSalesOrder(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
  ) {
    return this.quotationsService.convertToSalesOrder(id, tenantId, userId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete quotation' })
  @ApiResponse({ status: 200, description: 'Quotation deleted successfully' })
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.quotationsService.remove(id, tenantId);
  }
}

@ApiTags('sales-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales/orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create sales order' })
  @ApiResponse({ status: 201, description: 'Sales order created successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createSoDto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.create(tenantId, userId, createSoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales orders' })
  @ApiResponse({ status: 200, description: 'Sales orders retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() queryDto: SalesDocumentQueryDto) {
    return this.salesOrdersService.findAll(tenantId, queryDto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending sales orders (not fully delivered)' })
  @ApiResponse({ status: 200, description: 'Pending SOs retrieved successfully' })
  getPending(@GetTenantId() tenantId: string) {
    return this.salesOrdersService.getPendingSos(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  @ApiResponse({ status: 200, description: 'Sales order retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.salesOrdersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update sales order' })
  @ApiResponse({ status: 200, description: 'Sales order updated successfully' })
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateSoDto: UpdateSalesOrderDto,
  ) {
    return this.salesOrdersService.update(id, tenantId, updateSoDto);
  }

  @Post(':id/confirm')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Confirm sales order' })
  @ApiResponse({ status: 200, description: 'Sales order confirmed successfully' })
  confirm(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.salesOrdersService.confirm(id, tenantId);
  }

  @Post(':id/cancel')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Cancel sales order' })
  @ApiResponse({ status: 200, description: 'Sales order cancelled successfully' })
  cancel(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.salesOrdersService.cancel(id, tenantId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete sales order' })
  @ApiResponse({ status: 200, description: 'Sales order deleted successfully' })
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.salesOrdersService.remove(id, tenantId);
  }
}

