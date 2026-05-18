DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseIndentStatus') THEN
    CREATE TYPE "PurchaseIndentStatus" AS ENUM ('OPEN', 'APPROVED', 'CONVERTED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "purchase_indents" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "indentNumber" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "requiredQty" DECIMAL(10,3) NOT NULL,
  "availableQty" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "shortageQty" DECIMAL(10,3) NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourceReference" TEXT,
  "requiredBy" TIMESTAMP(3),
  "status" "PurchaseIndentStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "purchase_indents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "purchase_indents_indentNumber_key" ON "purchase_indents"("indentNumber");
CREATE INDEX IF NOT EXISTS "purchase_indents_tenantId_idx" ON "purchase_indents"("tenantId");
CREATE INDEX IF NOT EXISTS "purchase_indents_productId_idx" ON "purchase_indents"("productId");
CREATE INDEX IF NOT EXISTS "purchase_indents_indentNumber_idx" ON "purchase_indents"("indentNumber");
CREATE INDEX IF NOT EXISTS "purchase_indents_status_idx" ON "purchase_indents"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_indents_tenantId_fkey') THEN
    ALTER TABLE "purchase_indents" ADD CONSTRAINT "purchase_indents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_indents_productId_fkey') THEN
    ALTER TABLE "purchase_indents" ADD CONSTRAINT "purchase_indents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
