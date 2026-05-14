import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AccountType, AccountSubType } from '@prisma/client';

export class CreateAccountGroupDto {
  @ApiProperty({ example: 'Current Assets' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1000', description: 'Account code' })
  @IsString()
  code: string;

  @ApiProperty({ enum: AccountType, example: 'ASSET' })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ enum: AccountSubType, example: 'CURRENT_ASSET' })
  @IsOptional()
  @IsEnum(AccountSubType)
  subType?: AccountSubType;

  @ApiPropertyOptional({ example: 'uuid-of-parent-group' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: 'Assets that can be converted to cash within a year' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAccountGroupDto {
  @ApiPropertyOptional({ example: 'Current Assets' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLedgerAccountDto {
  @ApiProperty({ example: 'uuid-of-account-group' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 'State Bank of India - Main' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1010', description: 'Account code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Primary bank account for operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 50000, description: 'Opening balance' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  openingBalance?: number;
}

export class UpdateLedgerAccountDto {
  @ApiPropertyOptional({ example: 'State Bank of India - Main' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

