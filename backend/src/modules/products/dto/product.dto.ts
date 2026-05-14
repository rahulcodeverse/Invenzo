import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Dell Latitude 5520' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '15.6" FHD, Intel i5, 8GB RAM, 256GB SSD' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'uuid-of-brand' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ example: 'uuid-of-unit' })
  @IsUUID()
  unitId: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: ['https://cloudinary.com/image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice: number;

  @ApiProperty({ example: 55000 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mrp?: number;

  @ApiPropertyOptional({ example: 18, description: 'Tax rate in percentage' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasBatch?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasSerial?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Dell Latitude 5520' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'DELL-LAT-5520' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '15.6" FHD, Intel i5, 8GB RAM, 256GB SSD' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-brand' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-unit' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: ['https://cloudinary.com/image1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 55000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mrp?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasBatch?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasSerial?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductVariantDto {
  @ApiProperty({ example: 'Dell Latitude 5520 - 16GB RAM' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: { ram: '16GB', storage: '512GB SSD' } })
  @IsOptional()
  options?: Record<string, any>;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice: number;

  @ApiProperty({ example: 60000 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice: number;
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ example: 'Dell Latitude 5520 - 16GB RAM' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: { ram: '16GB', storage: '512GB SSD' } })
  @IsOptional()
  options?: Record<string, any>;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

