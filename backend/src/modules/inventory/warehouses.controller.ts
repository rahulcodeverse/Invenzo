import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  create(@GetTenantId() tenantId: string, @Body() createWarehouseDto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(tenantId, createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiResponse({ status: 200, description: 'Warehouses retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.inventoryService.findAllWarehouses(tenantId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiResponse({ status: 200, description: 'Warehouse retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.findOneWarehouse(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse updated successfully' })
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.inventoryService.updateWarehouse(id, tenantId, updateWarehouseDto);
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Delete warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted successfully' })
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.inventoryService.removeWarehouse(id, tenantId);
  }
}
