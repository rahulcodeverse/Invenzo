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
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  create(@GetTenantId() tenantId: string, @Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.create(tenantId, createVendorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.vendorsService.findAll(tenantId, paginationDto);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get vendor statement' })
  @ApiResponse({ status: 200, description: 'Vendor statement retrieved successfully' })
  async getStatement(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.vendorsService.getVendorStatement(id, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({ status: 200, description: 'Vendor retrieved successfully' })
  async findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.vendorsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully' })
  async update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(id, tenantId, updateVendorDto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete vendor' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  async remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.vendorsService.remove(id, tenantId);
  }
}

