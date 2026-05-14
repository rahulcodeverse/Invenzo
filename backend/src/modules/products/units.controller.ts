import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create new unit' })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  create(@GetTenantId() tenantId: string, @Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(tenantId, createUnitDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all units' })
  @ApiResponse({ status: 200, description: 'Units retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.unitsService.findAll(tenantId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit by ID' })
  @ApiResponse({ status: 200, description: 'Unit retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.unitsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update unit' })
  @ApiResponse({ status: 200, description: 'Unit updated successfully' })
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.update(id, tenantId, updateUnitDto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete unit' })
  @ApiResponse({ status: 200, description: 'Unit deleted successfully' })
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.unitsService.remove(id, tenantId);
  }
}

