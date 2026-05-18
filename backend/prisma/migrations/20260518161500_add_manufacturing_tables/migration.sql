DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkOrderStatus') THEN
    CREATE TYPE "WorkOrderStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "bill_of_materials" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "bomNumber" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "outputQty" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bom_items" (
  "id" TEXT NOT NULL,
  "bomId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "quantity" DECIMAL(10,3) NOT NULL,
  "wastagePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "routing_steps" (
  "id" TEXT NOT NULL,
  "bomId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "processName" TEXT NOT NULL,
  "workCenter" TEXT,
  "estimatedMinutes" INTEGER,
  "instructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "routing_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "work_orders" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "workOrderNumber" TEXT NOT NULL,
  "bomId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "salesOrderId" TEXT,
  "plannedQty" DECIMAL(10,2) NOT NULL,
  "producedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "rejectedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" "WorkOrderStatus" NOT NULL DEFAULT 'PLANNED',
  "plannedStart" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "work_order_materials" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "plannedQty" DECIMAL(10,3) NOT NULL,
  "issuedQty" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "consumedQty" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "work_order_materials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bill_of_materials_bomNumber_key" ON "bill_of_materials"("bomNumber");
CREATE INDEX IF NOT EXISTS "bill_of_materials_tenantId_idx" ON "bill_of_materials"("tenantId");
CREATE INDEX IF NOT EXISTS "bill_of_materials_productId_idx" ON "bill_of_materials"("productId");
CREATE INDEX IF NOT EXISTS "bill_of_materials_bomNumber_idx" ON "bill_of_materials"("bomNumber");
CREATE INDEX IF NOT EXISTS "bom_items_bomId_idx" ON "bom_items"("bomId");
CREATE INDEX IF NOT EXISTS "bom_items_materialId_idx" ON "bom_items"("materialId");
CREATE INDEX IF NOT EXISTS "routing_steps_bomId_idx" ON "routing_steps"("bomId");
CREATE UNIQUE INDEX IF NOT EXISTS "work_orders_workOrderNumber_key" ON "work_orders"("workOrderNumber");
CREATE INDEX IF NOT EXISTS "work_orders_tenantId_idx" ON "work_orders"("tenantId");
CREATE INDEX IF NOT EXISTS "work_orders_workOrderNumber_idx" ON "work_orders"("workOrderNumber");
CREATE INDEX IF NOT EXISTS "work_orders_bomId_idx" ON "work_orders"("bomId");
CREATE INDEX IF NOT EXISTS "work_orders_productId_idx" ON "work_orders"("productId");
CREATE INDEX IF NOT EXISTS "work_orders_warehouseId_idx" ON "work_orders"("warehouseId");
CREATE INDEX IF NOT EXISTS "work_orders_status_idx" ON "work_orders"("status");
CREATE INDEX IF NOT EXISTS "work_order_materials_workOrderId_idx" ON "work_order_materials"("workOrderId");
CREATE INDEX IF NOT EXISTS "work_order_materials_productId_idx" ON "work_order_materials"("productId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bill_of_materials_tenantId_fkey') THEN
    ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bill_of_materials_productId_fkey') THEN
    ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bom_items_bomId_fkey') THEN
    ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bom_items_materialId_fkey') THEN
    ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'routing_steps_bomId_fkey') THEN
    ALTER TABLE "routing_steps" ADD CONSTRAINT "routing_steps_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_tenantId_fkey') THEN
    ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_bomId_fkey') THEN
    ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_productId_fkey') THEN
    ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_warehouseId_fkey') THEN
    ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_order_materials_workOrderId_fkey') THEN
    ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_order_materials_productId_fkey') THEN
    ALTER TABLE "work_order_materials" ADD CONSTRAINT "work_order_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
