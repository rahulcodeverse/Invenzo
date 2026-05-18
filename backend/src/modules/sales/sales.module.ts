import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { QuotationsController, SalesOrdersController } from './sales-quotations.controller';
import { QuotationsService } from './quotations.service';
import { SalesOrdersService } from './sales-orders.service';
import {
  DeliveryController,
  SalesInvoicesController,
  CustomerPaymentsController,
} from './sales.controller';
import { DeliveryService } from './delivery.service';
import { SalesInvoicesService } from './sales-invoices.service';
import { CustomerPaymentsService } from './customer-payments.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [
    CustomersController,
    QuotationsController,
    SalesOrdersController,
    DeliveryController,
    SalesInvoicesController,
    CustomerPaymentsController,
  ],
  providers: [
    CustomersService,
    QuotationsService,
    SalesOrdersService,
    DeliveryService,
    SalesInvoicesService,
    CustomerPaymentsService,
  ],
  exports: [
    CustomersService,
    QuotationsService,
    SalesOrdersService,
    DeliveryService,
    SalesInvoicesService,
    CustomerPaymentsService,
  ],
})
export class SalesModule {}

