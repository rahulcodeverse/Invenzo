import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { WarehousesController } from './warehouses.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController, WarehousesController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

