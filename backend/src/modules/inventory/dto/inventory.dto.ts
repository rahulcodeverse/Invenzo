import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsEnum,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MovementType } from '@prisma/client';

export class StockInDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'PO-2024-0001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'uuid-of-purchase-order' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Received from vendor XYZ' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'BATCH-20240203-001' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: ['SN-001', 'SN-002'] })
  @IsOptional()
  @IsString({ each: true })
  serialNumbers?: string[];
}

export class StockOutDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'SO-2024-0001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'uuid-of-sales-order' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Sold to customer ABC' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'BATCH-20240203-001' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: ['SN-001'] })
  @IsOptional()
  @IsString({ each: true })
  serialNumbers?: string[];
}

export class StockTransferDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-source-warehouse' })
  @IsUUID()
  fromWarehouseId: string;

  @ApiProperty({ example: 'uuid-of-destination-warehouse' })
  @IsUUID()
  toWarehouseId: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Transfer for stock balancing' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'BATCH-20240203-001' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: ['SN-001', 'SN-002'] })
  @IsOptional()
  @IsString({ each: true })
  serialNumbers?: string[];
}

export class StockAdjustmentDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 'ADJUSTMENT', enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ example: 5, description: 'Positive for addition, negative for reduction' })
  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 'Stock count adjustment - damaged items' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'BATCH-20240203-001' })
  @IsOptional()
  @IsString()
  batchNumber?: string;
}

export class CreateBatchDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 'BATCH-20240203-001' })
  @IsString()
  batchNumber: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreateSerialDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: ['SN-001', 'SN-002', 'SN-003'] })
  @IsString({ each: true })
  serialNumbers: string[];
}

