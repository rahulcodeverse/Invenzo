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
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class DeliveryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'uuid-of-sales-order' })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;
}

export class SalesInvoiceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class CustomerPaymentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'uuid-of-customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

// Delivery Note DTOs
export class DeliveryItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 15, description: 'Quantity to deliver' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'BATCH-2024-001' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: ['SN-001', 'SN-002'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];
}

export class CreateDeliveryNoteDto {
  @ApiProperty({ example: 'uuid-of-sales-order' })
  @IsUUID()
  salesOrderId: string;

  @ApiProperty({ example: 'uuid-of-warehouse' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ type: [DeliveryItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliveryItemDto)
  items: DeliveryItemDto[];

  @ApiPropertyOptional({ example: '2024-02-03' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 'All items delivered in good condition' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Sales Invoice DTOs
export class CreateSalesInvoiceDto {
  @ApiProperty({ example: 'uuid-of-sales-order' })
  @IsUUID()
  salesOrderId: string;

  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ example: 'uuid-of-delivery-note' })
  @IsOptional()
  @IsUUID()
  deliveryNoteId?: string;

  @ApiPropertyOptional({ example: '2024-02-03' })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiProperty({ example: '2024-03-03', description: 'Payment due date' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 55000, description: 'Subtotal amount' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 9900, description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 500, description: 'Discount amount' })
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

// Customer Payment DTOs
export class CreateCustomerPaymentDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ example: 'uuid-of-invoice' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({ example: 30000, description: 'Payment amount' })
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

  @ApiPropertyOptional({ example: 'TXN987654321' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Partial payment for invoice SINV-001' })
  @IsOptional()
  @IsString()
  notes?: string;
}

