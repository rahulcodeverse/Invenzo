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
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SalesDocumentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

// Quotation DTOs
export class QuotationItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 550 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 18, description: 'Tax rate in percentage' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ example: 50, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;
}

export class CreateQuotationDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: '2024-03-15', description: 'Valid until date' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @ApiPropertyOptional({ example: 500, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Quotation for Q1 requirements' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Payment within 30 days. Delivery in 7 days.' })
  @IsOptional()
  @IsString()
  termsConditions?: string;
}

export class UpdateQuotationDto {
  @ApiPropertyOptional({ example: '2024-03-20' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ type: [QuotationItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items?: QuotationItemDto[];

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Updated terms' })
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

// Sales Order DTOs
export class SalesOrderItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 550 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 18, description: 'Tax rate in percentage' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ example: 100, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ example: 'uuid-of-quotation' })
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];

  @ApiPropertyOptional({ example: 1000, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Rush order for important client' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSalesOrderDto {
  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: '2024-03-05' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ type: [SalesOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items?: SalesOrderItemDto[];

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

