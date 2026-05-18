import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class GrnItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 50, description: 'Quantity received' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'BATCH-2024-001' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreateGrnDto {
  @ApiProperty({ example: 'uuid-of-purchase-order' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ type: [GrnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GrnItemDto)
  items: GrnItemDto[];

  @ApiPropertyOptional({ example: '2024-02-03' })
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiPropertyOptional({ example: 'All items received in good condition' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseInvoiceDto {
  @ApiProperty({ example: 'uuid-of-purchase-order' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiProperty({ example: 'uuid-of-vendor' })
  @IsUUID()
  vendorId: string;

  @ApiPropertyOptional({ example: 'uuid-of-grn' })
  @IsOptional()
  @IsUUID()
  grnId?: string;

  @ApiPropertyOptional({ example: '2024-02-03' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiProperty({ example: '2024-03-03', description: 'Payment due date' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 45000, description: 'Subtotal amount' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 8100, description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Invoice notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateVendorPaymentDto {
  @ApiProperty({ example: 'uuid-of-vendor' })
  @IsUUID()
  vendorId: string;

  @ApiPropertyOptional({ example: 'uuid-of-invoice' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({ example: 25000, description: 'Payment amount' })
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: '2024-02-03' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Partial payment for invoice INV-001' })
  @IsOptional()
  @IsString()
  notes?: string;
}

