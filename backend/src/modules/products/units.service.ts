import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createUnitDto: CreateUnitDto) {
    const existing = await this.prisma.unit.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: createUnitDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Unit with this name already exists');
    }

    return this.prisma.unit.create({
      data: {
        ...createUnitDto,
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
        { symbol: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
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
      this.prisma.unit.count({ where }),
    ]);

    return PaginationHelper.paginate(units, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async update(id: string, tenantId: string, updateUnitDto: UpdateUnitDto) {
    const existing = await this.findOne(id, tenantId);

    if (updateUnitDto.name && updateUnitDto.name !== existing.name) {
      const conflict = await this.prisma.unit.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateUnitDto.name,
          },
        },
      });

      if (conflict) {
        throw new ConflictException('Unit with this name already exists');
      }
    }

    return this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    const productCount = await this.prisma.product.count({
      where: { unitId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete unit with ${productCount} products. Change unit or delete products first.`,
      );
    }

    await this.prisma.unit.delete({
      where: { id },
    });

    return { message: 'Unit deleted successfully' };
  }
}

