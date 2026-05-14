import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'Piece' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'pcs' })
  @IsString()
  symbol: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional({ example: 'Piece' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'pcs' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

