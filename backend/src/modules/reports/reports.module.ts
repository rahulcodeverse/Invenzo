import { Module } from '@nestjs/common';
import {
  KpiController,
  SalesAnalyticsController,
  InventoryAnalyticsController,
  GstReportController,
} from './reports.controller';
import { KpiService } from './kpi.service';
import { SalesAnalyticsService } from './sales-analytics.service';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import { GstReportService } from './gst-report.service';

@Module({
  controllers: [
    KpiController,
    SalesAnalyticsController,
    InventoryAnalyticsController,
    GstReportController,
  ],
  providers: [
    KpiService,
    SalesAnalyticsService,
    InventoryAnalyticsService,
    GstReportService,
  ],
  exports: [
    KpiService,
    SalesAnalyticsService,
    InventoryAnalyticsService,
    GstReportService,
  ],
})
export class ReportsModule {}

