import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '@prisma/client';

export class BomItemDto {
  @ApiProperty({ example: 'uuid-of-raw-material' })
  @IsUUID()
  materialId: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  wastagePercent?: number;

  @ApiPropertyOptional({ example: 'Allow cutting loss' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RoutingStepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  sequence: number;

  @ApiProperty({ example: 'Assembly' })
  @IsString()
  processName: string;

  @ApiPropertyOptional({ example: 'Assembly Line 1' })
  @IsOptional()
  @IsString()
  workCenter?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: 'Attach dock board and run QA checklist' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateBomDto {
  @ApiProperty({ example: 'uuid-of-finished-good' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'OpsBook 14 Pro Assembly BOM' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  outputQty?: number;

  @ApiPropertyOptional({ example: 'Primary production BOM' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [BomItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  items: BomItemDto[];

  @ApiPropertyOptional({ type: [RoutingStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutingStepDto)
  routingSteps?: RoutingStepDto[];
}

export class UpdateBomDto {
  @ApiPropertyOptional({ example: 'OpsBook 14 Pro Assembly BOM' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '1.1' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  outputQty?: number;

  @ApiPropertyOptional({ example: 'Updated production BOM' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'uuid-of-bom' })
  @IsUUID()
  bomId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ example: 'uuid-of-sales-order' })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  plannedQty: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Make-to-order production run' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({ enum: WorkOrderStatus })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  producedQty?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  rejectedQty?: number;

  @ApiPropertyOptional({ example: 'Production completed with minor rejection' })
  @IsOptional()
  @IsString()
  notes?: string;
}
