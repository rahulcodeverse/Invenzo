import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createCategoryDto: CreateCategoryDto) {
    // Check if category with same name exists
    const existing = await this.prisma.category.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: createCategoryDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    // If parentId is provided, verify it exists and belongs to tenant
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: createCategoryDto.parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
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

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return PaginationHelper.paginate(categories, total, page, limit);
  }

  async findAllTree(tenantId: string) {
    // Get all categories for this tenant
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        children: {
          include: {
            children: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Return only root categories (those without parent)
    return categories.filter(cat => !cat.parentId);
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, tenantId: string, updateCategoryDto: UpdateCategoryDto) {
    const existing = await this.findOne(id, tenantId);

    // Check for name conflict if name is being changed
    if (updateCategoryDto.name && updateCategoryDto.name !== existing.name) {
      const conflict = await this.prisma.category.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateCategoryDto.name,
          },
        },
      });

      if (conflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Verify parent category if parentId is being changed
    if (updateCategoryDto.parentId) {
      // Prevent self-reference
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findFirst({
        where: {
          id: updateCategoryDto.parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Prevent circular reference (check if new parent is a child of this category)
      const descendants = await this.getDescendants(id, tenantId);
      if (descendants.some(d => d.id === updateCategoryDto.parentId)) {
        throw new ConflictException('Cannot set a descendant as parent');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const category = await this.findOne(id, tenantId);

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${productCount} products. Move or delete products first.`,
      );
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new ConflictException(
        `Cannot delete category with ${category.children.length} sub-categories. Delete them first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  private async getDescendants(categoryId: string, tenantId: string) {
    const descendants: any[] = [];
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId, tenantId },
    });

    for (const child of children) {
      descendants.push(child);
      const childDescendants = await this.getDescendants(child.id, tenantId);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}

