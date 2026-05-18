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
import { DeliveryService } from './delivery.service';
import { SalesInvoicesService } from './sales-invoices.service';
import { CustomerPaymentsService } from './customer-payments.service';
import {
  CreateDeliveryNoteDto,
  CreateSalesInvoiceDto,
  CreateCustomerPaymentDto,
  DeliveryQueryDto,
  SalesInvoiceQueryDto,
  CustomerPaymentQueryDto,
} from './dto/delivery-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@ApiTags('delivery-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales/delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create delivery note (auto updates inventory)' })
  @ApiResponse({ status: 201, description: 'Delivery created and stock updated successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createDeliveryDto: CreateDeliveryNoteDto,
  ) {
    return this.deliveryService.create(tenantId, userId, createDeliveryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all delivery notes' })
  @ApiResponse({ status: 200, description: 'Delivery notes retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() queryDto: DeliveryQueryDto) {
    return this.deliveryService.findAll(tenantId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery note by ID' })
  @ApiResponse({ status: 200, description: 'Delivery note retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.deliveryService.findOne(id, tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download delivery challan PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.createDeliveryChallanPdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="delivery-challan-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

@ApiTags('sales-invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales/invoice')
export class SalesInvoicesController {
  constructor(
    private readonly invoicesService: SalesInvoicesService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create sales invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createInvoiceDto: CreateSalesInvoiceDto,
  ) {
    return this.invoicesService.create(tenantId, userId, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() queryDto: SalesInvoiceQueryDto) {
    return this.invoicesService.findAll(tenantId, queryDto);
  }

  @Get('outstanding')
  @ApiOperation({ summary: 'Get outstanding invoices' })
  @ApiResponse({ status: 200, description: 'Outstanding invoices retrieved successfully' })
  getOutstanding(@GetTenantId() tenantId: string) {
    return this.invoicesService.getOutstandingInvoices(tenantId);
  }

  @Get('customer-wise-outstanding')
  @ApiOperation({ summary: 'Get customer-wise outstanding amounts' })
  @ApiResponse({ status: 200, description: 'Customer-wise outstanding retrieved successfully' })
  getCustomerWiseOutstanding(@GetTenantId() tenantId: string) {
    return this.invoicesService.getCustomerWiseOutstanding(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.invoicesService.findOne(id, tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download GST sales invoice PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.createSalesInvoicePdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sales-invoice-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

@ApiTags('customer-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales/payment')
export class CustomerPaymentsController {
  constructor(private readonly paymentsService: CustomerPaymentsService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Record customer payment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  create(
    @GetTenantId() tenantId: string,
    @GetUser('id') userId: string,
    @Body() createPaymentDto: CreateCustomerPaymentDto,
  ) {
    return this.paymentsService.create(tenantId, userId, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customer payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() queryDto: CustomerPaymentQueryDto) {
    return this.paymentsService.findAll(tenantId, queryDto);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get payment history for customer' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  getCustomerHistory(@Param('customerId') customerId: string, @GetTenantId() tenantId: string) {
    return this.paymentsService.getCustomerPaymentHistory(customerId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.paymentsService.findOne(id, tenantId);
  }
}

