import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JournalType, LineType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class JournalLineDto {
  @ApiProperty({ example: 'uuid-of-ledger-account' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ enum: LineType, example: 'DEBIT' })
  @IsEnum(LineType)
  type: LineType;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Payment for invoice INV-001' })
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ enum: JournalType, example: 'MANUAL' })
  @IsEnum(JournalType)
  type: JournalType;

  @ApiPropertyOptional({ example: '2024-02-03' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'INV-2024-0001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'uuid-of-reference-entity' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ example: 'Payment received from customer' })
  @IsString()
  narration: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class QueryJournalDto extends PaginationDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: JournalType })
  @IsOptional()
  @IsEnum(JournalType)
  type?: JournalType;

  @ApiPropertyOptional({ example: 'uuid-of-account' })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

