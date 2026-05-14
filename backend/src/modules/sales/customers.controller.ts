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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(@GetTenantId() tenantId: string, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(tenantId, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.customersService.findAll(tenantId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.customersService.findOne(id, tenantId);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get customer statement' })
  @ApiResponse({ status: 200, description: 'Customer statement retrieved successfully' })
  getStatement(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.customersService.getCustomerStatement(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, tenantId, updateCustomerDto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.customersService.remove(id, tenantId);
  }
}

