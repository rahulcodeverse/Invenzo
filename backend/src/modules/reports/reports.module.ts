import { Module } from '@nestjs/common';
import {
  KpiController,
  SalesAnalyticsController,
  InventoryAnalyticsController,
} from './reports.controller';
import { KpiService } from './kpi.service';
import { SalesAnalyticsService } from './sales-analytics.service';
import { InventoryAnalyticsService } from './inventory-analytics.service';

@Module({
  controllers: [
    KpiController,
    SalesAnalyticsController,
    InventoryAnalyticsController,
  ],
  providers: [
    KpiService,
    SalesAnalyticsService,
    InventoryAnalyticsService,
  ],
  exports: [
    KpiService,
    SalesAnalyticsService,
    InventoryAnalyticsService,
  ],
})
export class ReportsModule {}

