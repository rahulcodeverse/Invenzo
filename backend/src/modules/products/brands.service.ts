import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createBrandDto: CreateBrandDto) {
    const existing = await this.prisma.brand.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: createBrandDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Brand with this name already exists');
    }

    return this.prisma.brand.create({
      data: {
        ...createBrandDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return PaginationHelper.paginate(brands, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: string, tenantId: string, updateBrandDto: UpdateBrandDto) {
    const existing = await this.findOne(id, tenantId);

    if (updateBrandDto.name && updateBrandDto.name !== existing.name) {
      const conflict = await this.prisma.brand.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateBrandDto.name,
          },
        },
      });

      if (conflict) {
        throw new ConflictException('Brand with this name already exists');
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete brand with ${productCount} products. Change brand or delete products first.`,
      );
    }

    await this.prisma.brand.delete({
      where: { id },
    });

    return { message: 'Brand deleted successfully' };
  }
}

