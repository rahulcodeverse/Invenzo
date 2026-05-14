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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@GetTenantId() tenantId: string, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(tenantId, createProductDto);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  getLowStock(@GetTenantId() tenantId: string) {
    return this.productsService.getLowStockProducts(tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@GetTenantId() tenantId: string, @Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(tenantId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  findOne(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.productsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, tenantId, updateProductDto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.productsService.remove(id, tenantId);
  }

  // Variant endpoints
  @Post(':id/variants')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create product variant' })
  @ApiResponse({ status: 201, description: 'Variant created successfully' })
  createVariant(
    @Param('id') productId: string,
    @GetTenantId() tenantId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, tenantId, createVariantDto);
  }

  @Patch(':id/variants/:variantId')
  @Roles('OWNER', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update product variant' })
  @ApiResponse({ status: 200, description: 'Variant updated successfully' })
  updateVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @GetTenantId() tenantId: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, productId, tenantId, updateVariantDto);
  }

  @Delete(':id/variants/:variantId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete product variant' })
  @ApiResponse({ status: 200, description: 'Variant deleted successfully' })
  removeVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.productsService.removeVariant(variantId, productId, tenantId);
  }
}

