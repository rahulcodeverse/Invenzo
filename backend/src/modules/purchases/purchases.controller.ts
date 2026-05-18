import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { GrnService } from './grn.service';
import { PurchaseInvoicesService } from './invoices.service';
import { VendorPaymentsService } from './payments.service';
import {
  CreateGrnDto,
  CreatePurchaseInvoiceDto,
  CreateVendorPaymentDto,
} from './dto/grn-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('goods-received-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases/grn')
export class GrnController {
  constructor(private readonly grnService: GrnService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create goods received note (auto updates inventory)' })
  @ApiResponse({ status: 201, description: 'GRN created and stock updated successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createGrnDto: CreateGrnDto,
  ) {
    return this.grnService.create(tenantId, userId, createGrnDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all GRNs' })
  @ApiResponse({ status: 200, description: 'GRNs retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.grnService.findAll(tenantId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GRN by ID' })
  @ApiResponse({ status: 200, description: 'GRN retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.grnService.findOne(id, tenantId);
  }
}

@ApiTags('purchase-invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases/invoice')
export class PurchaseInvoicesController {
  constructor(
    private readonly invoicesService: PurchaseInvoicesService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create purchase invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createInvoiceDto: CreatePurchaseInvoiceDto,
  ) {
    return this.invoicesService.create(tenantId, userId, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.invoicesService.findAll(tenantId, paginationDto);
  }

  @Get('outstanding')
  @ApiOperation({ summary: 'Get outstanding invoices' })
  @ApiResponse({ status: 200, description: 'Outstanding invoices retrieved successfully' })
  getOutstanding(@GetTenantId() tenantId: string) {
    return this.invoicesService.getOutstandingInvoices(tenantId);
  }

  @Get('vendor-wise-outstanding')
  @ApiOperation({ summary: 'Get vendor-wise outstanding amounts' })
  @ApiResponse({ status: 200, description: 'Vendor-wise outstanding retrieved successfully' })
  getVendorWiseOutstanding(@GetTenantId() tenantId: string) {
    return this.invoicesService.getVendorWiseOutstanding(tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download purchase invoice PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.createPurchaseInvoicePdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="purchase-invoice-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.invoicesService.findOne(id, tenantId);
  }
}

@ApiTags('vendor-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases/payment')
export class VendorPaymentsController {
  constructor(private readonly paymentsService: VendorPaymentsService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Record vendor payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createPaymentDto: CreateVendorPaymentDto,
  ) {
    return this.paymentsService.create(tenantId, userId, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendor payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.paymentsService.findAll(tenantId, paginationDto);
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get payment history for vendor' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  getVendorHistory(@Param('vendorId') vendorId: string, @GetTenantId() tenantId: string) {
    return this.paymentsService.getVendorPaymentHistory(vendorId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.paymentsService.findOne(id, tenantId);
  }
}

