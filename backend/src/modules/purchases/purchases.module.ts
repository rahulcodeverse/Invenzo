import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  GrnController,
  PurchaseInvoicesController,
  VendorPaymentsController,
} from './purchases.controller';
import { GrnService } from './grn.service';
import { PurchaseInvoicesService } from './invoices.service';
import { VendorPaymentsService } from './payments.service';
import { InventoryModule } from '../inventory/inventory.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [InventoryModule, DocumentsModule],
  controllers: [
    VendorsController,
    PurchaseOrdersController,
    GrnController,
    PurchaseInvoicesController,
    VendorPaymentsController,
  ],
  providers: [
    VendorsService,
    PurchaseOrdersService,
    GrnService,
    PurchaseInvoicesService,
    VendorPaymentsService,
  ],
  exports: [
    VendorsService,
    PurchaseOrdersService,
    GrnService,
    PurchaseInvoicesService,
    VendorPaymentsService,
  ],
})
export class PurchasesModule {}

