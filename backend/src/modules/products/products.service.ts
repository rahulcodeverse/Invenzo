import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto/product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { SkuGenerator } from '../../common/utils/sku-generator.helper';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createProductDto: CreateProductDto) {
    // Verify category exists
    const category = await this.prisma.category.findFirst({
      where: { id: createProductDto.categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify unit exists
    const unit = await this.prisma.unit.findFirst({
      where: { id: createProductDto.unitId, tenantId },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Verify brand if provided
    if (createProductDto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: createProductDto.brandId, tenantId },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    // Generate SKU
    const sku = SkuGenerator.generate(category.name, createProductDto.name);

    // Check for SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku },
    });

    if (existingSku) {
      throw new ConflictException('Generated SKU already exists. Please try again.');
    }

    // Create product
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        sku,
        tenantId,
      },
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    });

    // Create initial stock entries for all warehouses
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId, isActive: true },
    });

    await Promise.all(
      warehouses.map(warehouse =>
        this.prisma.stock.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: 0,
            reserved: 0,
            available: 0,
          },
        }),
      ),
    );

    return product;
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              symbol: true,
            },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          stocks: {
            select: {
              warehouseId: true,
              quantity: true,
              available: true,
              warehouse: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Calculate total stock across all warehouses
    const productsWithTotal = products.map(product => ({
      ...product,
      totalStock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
    }));

    return PaginationHelper.paginate(productsWithTotal, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        brand: true,
        unit: true,
        variants: {
          where: { isActive: true },
        },
        stocks: {
          include: {
            warehouse: true,
            batches: {
              where: {
                quantity: { gt: 0 },
              },
              orderBy: {
                expiryDate: 'asc',
              },
            },
            serials: {
              where: {
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, tenantId: string, updateProductDto: UpdateProductDto) {
    const existing = await this.findOne(id, tenantId);

    // Verify category if being changed
    if (updateProductDto.categoryId && updateProductDto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: updateProductDto.categoryId, tenantId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Verify unit if being changed
    if (updateProductDto.unitId && updateProductDto.unitId !== existing.unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: updateProductDto.unitId, tenantId },
      });

      if (!unit) {
        throw new NotFoundException('Unit not found');
      }
    }

    // Verify brand if being changed
    if (updateProductDto.brandId && updateProductDto.brandId !== existing.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: updateProductDto.brandId, tenantId },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        brand: true,
        unit: true,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const product = await this.findOne(id, tenantId);

    // Check for stock
    const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    if (totalStock > 0) {
      throw new ConflictException(
        `Cannot delete product with stock (${totalStock} units). Clear stock first.`,
      );
    }

    // Check for pending orders
    const purchaseCount = await this.prisma.purchaseOrderItem.count({
      where: { productId: id },
    });

    const salesCount = await this.prisma.salesOrderItem.count({
      where: { productId: id },
    });

    if (purchaseCount > 0 || salesCount > 0) {
      throw new ConflictException(
        'Cannot delete product with existing purchase or sales orders. Archive it instead.',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  // Variant Management
  async createVariant(
    productId: string,
    tenantId: string,
    createVariantDto: CreateProductVariantDto,
  ) {
    const product = await this.findOne(productId, tenantId);

    if (!product.hasVariants) {
      throw new BadRequestException('Product is not configured for variants');
    }

    // Generate SKU for variant
    const sku = SkuGenerator.generate(
      product.category.name,
      `${product.name}-${createVariantDto.name}`,
    );

    return this.prisma.productVariant.create({
      data: {
        ...createVariantDto,
        productId,
        sku,
      },
    });
  }

  async updateVariant(
    variantId: string,
    productId: string,
    tenantId: string,
    updateVariantDto: UpdateProductVariantDto,
  ) {
    const product = await this.findOne(productId, tenantId);

    const variant = product.variants.find(v => v.id === variantId);

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: updateVariantDto,
    });
  }

  async removeVariant(variantId: string, productId: string, tenantId: string) {
    const product = await this.findOne(productId, tenantId);

    const variant = product.variants.find(v => v.id === variantId);

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    await this.prisma.productVariant.delete({
      where: { id: variantId },
    });

    return { message: 'Product variant deleted successfully' };
  }

  // Low Stock Alert
  async getLowStockProducts(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Filter products where total stock <= minStockLevel
    const lowStockProducts = products.filter(product => {
      const totalStock = product.stocks.reduce((sum, stock) => sum + stock.available, 0);
      return totalStock <= product.minStockLevel;
    });

    return lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category.name,
      minStockLevel: product.minStockLevel,
      currentStock: product.stocks.reduce((sum, stock) => sum + stock.available, 0),
      stocks: product.stocks.map(stock => ({
        warehouse: stock.warehouse.name,
        quantity: stock.available,
      })),
    }));
  }
}

