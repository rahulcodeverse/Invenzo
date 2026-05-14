import { IsDateString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class TrendQueryDto extends DateRangeDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], example: 'day' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

export class LimitDto {
  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DateRangeLimitDto extends DateRangeDto {
  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

export class DeadStockQueryDto {
  @ApiPropertyOptional({ example: 90, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  daysSinceLastMovement?: number;
}

export class ExpiryQueryDto {
  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  daysUntilExpiry?: number;
}

