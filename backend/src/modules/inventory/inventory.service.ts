import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StockInDto,
  StockOutDto,
  StockTransferDto,
  StockAdjustmentDto,
  CreateBatchDto,
  CreateSerialDto,
} from './dto/inventory.dto';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { MovementType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Stock IN operation
  async stockIn(tenantId: string, userId: string, stockInDto: StockInDto) {
    // Verify product exists and belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: {
        id: stockInDto.productId,
        tenantId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify warehouse exists and belongs to tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: stockInDto.warehouseId,
        tenantId,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Execute stock IN operation in transaction
    return this.prisma.$transaction(async tx => {
      // Get or create stock record
      let stock = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: stockInDto.productId,
            warehouseId: stockInDto.warehouseId,
          },
        },
      });

      if (!stock) {
        stock = await tx.stock.create({
          data: {
            productId: stockInDto.productId,
            warehouseId: stockInDto.warehouseId,
            quantity: 0,
            reserved: 0,
            available: 0,
          },
        });
      }

      // Update stock quantities
      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: stock.quantity + stockInDto.quantity,
          available: stock.available + stockInDto.quantity,
        },
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          warehouseId: stockInDto.warehouseId,
          productId: stockInDto.productId,
          type: MovementType.IN,
          quantity: stockInDto.quantity,
          reference: stockInDto.reference,
          referenceId: stockInDto.referenceId,
          notes: stockInDto.notes,
          createdBy: userId,
        },
      });

      // Handle batch tracking if enabled
      if (product.hasBatch && stockInDto.batchNumber) {
        await tx.batch.create({
          data: {
            stockId: stock.id,
            batchNumber: stockInDto.batchNumber,
            quantity: stockInDto.quantity,
            manufactureDate: stockInDto.manufactureDate
              ? new Date(stockInDto.manufactureDate)
              : null,
            expiryDate: stockInDto.expiryDate ? new Date(stockInDto.expiryDate) : null,
          },
        });
      }

      // Handle serial number tracking if enabled
      if (product.hasSerial && stockInDto.serialNumbers && stockInDto.serialNumbers.length > 0) {
        if (stockInDto.serialNumbers.length !== stockInDto.quantity) {
          throw new BadRequestException(
            'Number of serial numbers must match quantity for serial-tracked products',
          );
        }

        await tx.serial.createMany({
          data: stockInDto.serialNumbers.map(serialNumber => ({
            stockId: stock.id,
            serialNumber,
            isAvailable: true,
          })),
        });
      }

      return {
        stock: updatedStock,
        movement,
        message: `Successfully added ${stockInDto.quantity} units to stock`,
      };
    });
  }

  // Stock OUT operation
  async stockOut(tenantId: string, userId: string, stockOutDto: StockOutDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: stockOutDto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: stockOutDto.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return this.prisma.$transaction(async tx => {
      // Get stock record
      const stock = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: stockOutDto.productId,
            warehouseId: stockOutDto.warehouseId,
          },
        },
      });

      if (!stock) {
        throw new NotFoundException('No stock found for this product in this warehouse');
      }

      // Check sufficient stock
      if (stock.available < stockOutDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${stock.available}, Requested: ${stockOutDto.quantity}`,
        );
      }

      // Update stock quantities
      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: stock.quantity - stockOutDto.quantity,
          available: stock.available - stockOutDto.quantity,
        },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          warehouseId: stockOutDto.warehouseId,
          productId: stockOutDto.productId,
          type: MovementType.OUT,
          quantity: stockOutDto.quantity,
          reference: stockOutDto.reference,
          referenceId: stockOutDto.referenceId,
          notes: stockOutDto.notes,
          createdBy: userId,
        },
      });

      // Handle batch deduction (FIFO)
      if (product.hasBatch && stockOutDto.batchNumber) {
        const batch = await tx.batch.findFirst({
          where: {
            stockId: stock.id,
            batchNumber: stockOutDto.batchNumber,
          },
        });

        if (!batch || batch.quantity < stockOutDto.quantity) {
          throw new BadRequestException('Insufficient quantity in specified batch');
        }

        await tx.batch.update({
          where: { id: batch.id },
          data: {
            quantity: batch.quantity - stockOutDto.quantity,
          },
        });
      }

      // Handle serial number deduction
      if (product.hasSerial && stockOutDto.serialNumbers && stockOutDto.serialNumbers.length > 0) {
        if (stockOutDto.serialNumbers.length !== stockOutDto.quantity) {
          throw new BadRequestException(
            'Number of serial numbers must match quantity for serial-tracked products',
          );
        }

        // Verify all serials exist and are available
        const serials = await tx.serial.findMany({
          where: {
            stockId: stock.id,
            serialNumber: { in: stockOutDto.serialNumbers },
          },
        });

        if (serials.length !== stockOutDto.serialNumbers.length) {
          throw new BadRequestException('One or more serial numbers not found');
        }

        const unavailableSerials = serials.filter(s => !s.isAvailable);
        if (unavailableSerials.length > 0) {
          throw new BadRequestException(
            `Serial numbers already issued: ${unavailableSerials.map(s => s.serialNumber).join(', ')}`,
          );
        }

        // Mark serials as unavailable
        await tx.serial.updateMany({
          where: {
            stockId: stock.id,
            serialNumber: { in: stockOutDto.serialNumbers },
          },
          data: {
            isAvailable: false,
          },
        });
      }

      return {
        stock: updatedStock,
        movement,
        message: `Successfully removed ${stockOutDto.quantity} units from stock`,
      };
    });
  }

  // Stock TRANSFER operation
  async stockTransfer(tenantId: string, userId: string, transferDto: StockTransferDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: transferDto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (transferDto.fromWarehouseId === transferDto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses cannot be the same');
    }

    // Verify both warehouses
    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: transferDto.fromWarehouseId, tenantId },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: transferDto.toWarehouseId, tenantId },
      }),
    ]);

    if (!fromWarehouse || !toWarehouse) {
      throw new NotFoundException('One or both warehouses not found');
    }

    return this.prisma.$transaction(async tx => {
      // Deduct from source
      const fromStock = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: transferDto.productId,
            warehouseId: transferDto.fromWarehouseId,
          },
        },
      });

      if (!fromStock || fromStock.available < transferDto.quantity) {
        throw new BadRequestException('Insufficient stock in source warehouse');
      }

      await tx.stock.update({
        where: { id: fromStock.id },
        data: {
          quantity: fromStock.quantity - transferDto.quantity,
          available: fromStock.available - transferDto.quantity,
        },
      });

      // Add to destination
      let toStock = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: transferDto.productId,
            warehouseId: transferDto.toWarehouseId,
          },
        },
      });

      if (!toStock) {
        toStock = await tx.stock.create({
          data: {
            productId: transferDto.productId,
            warehouseId: transferDto.toWarehouseId,
            quantity: 0,
            reserved: 0,
            available: 0,
          },
        });
      }

      await tx.stock.update({
        where: { id: toStock.id },
        data: {
          quantity: toStock.quantity + transferDto.quantity,
          available: toStock.available + transferDto.quantity,
        },
      });

      // Create transfer movement
      const movement = await tx.stockMovement.create({
        data: {
          warehouseId: transferDto.fromWarehouseId,
          productId: transferDto.productId,
          type: MovementType.TRANSFER,
          quantity: transferDto.quantity,
          fromWarehouseId: transferDto.fromWarehouseId,
          toWarehouseId: transferDto.toWarehouseId,
          notes: transferDto.notes,
          createdBy: userId,
        },
      });

      return {
        fromStock: fromStock,
        toStock: toStock,
        movement,
        message: `Successfully transferred ${transferDto.quantity} units from ${fromWarehouse.name} to ${toWarehouse.name}`,
      };
    });
  }

  // Stock ADJUSTMENT operation
  async stockAdjustment(tenantId: string, userId: string, adjustmentDto: StockAdjustmentDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: adjustmentDto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: adjustmentDto.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return this.prisma.$transaction(async tx => {
      let stock = await tx.stock.findUnique({
        where: {
          productId_warehouseId: {
            productId: adjustmentDto.productId,
            warehouseId: adjustmentDto.warehouseId,
          },
        },
      });

      if (!stock) {
        stock = await tx.stock.create({
          data: {
            productId: adjustmentDto.productId,
            warehouseId: adjustmentDto.warehouseId,
            quantity: 0,
            reserved: 0,
            available: 0,
          },
        });
      }

      // Check for negative stock
      const newQuantity = stock.quantity + adjustmentDto.quantity;
      const newAvailable = stock.available + adjustmentDto.quantity;

      if (newQuantity < 0 || newAvailable < 0) {
        throw new BadRequestException('Adjustment would result in negative stock');
      }

      // Update stock
      const updatedStock = await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: newQuantity,
          available: newAvailable,
        },
      });

      // Create movement
      const movement = await tx.stockMovement.create({
        data: {
          warehouseId: adjustmentDto.warehouseId,
          productId: adjustmentDto.productId,
          type: adjustmentDto.type,
          quantity: Math.abs(adjustmentDto.quantity),
          notes: adjustmentDto.reason,
          createdBy: userId,
        },
      });

      return {
        stock: updatedStock,
        movement,
        message: `Stock adjusted by ${adjustmentDto.quantity} units`,
      };
    });
  }

  // Get stock for a product across all warehouses
  async getProductStock(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        stocks: {
          include: {
            warehouse: true,
            batches: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
            },
            serials: {
              where: { isAvailable: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalAvailable = product.stocks.reduce((sum, stock) => sum + stock.available, 0);
    const totalReserved = product.stocks.reduce((sum, stock) => sum + stock.reserved, 0);

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        minStockLevel: product.minStockLevel,
      },
      totalStock,
      totalAvailable,
      totalReserved,
      warehouseStock: product.stocks.map(stock => ({
        warehouse: stock.warehouse,
        quantity: stock.quantity,
        available: stock.available,
        reserved: stock.reserved,
        batches: stock.batches,
        serials: stock.serials,
      })),
    };
  }

  // Get stock movements with pagination
  async getStockMovements(tenantId: string, queryDto: any) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      startDate,
      endDate,
      productId,
      warehouseId,
      type,
      userId,
      referenceNo,
      minQuantity,
      maxQuantity
    } = queryDto;

    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    // Get products for this tenant
    const productIds = await this.prisma.product
      .findMany({
        where: { tenantId },
        select: { id: true },
      })
      .then(products => products.map(p => p.id));

    // Build where clause
    const where: any = {
      productId: { in: productIds },
    };

    // Apply filters
    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    if (referenceNo) {
      where.reference = { contains: referenceNo, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (minQuantity !== undefined || maxQuantity !== undefined) {
      where.quantity = {};
      if (minQuantity !== undefined) {
        where.quantity.gte = minQuantity;
      }
      if (maxQuantity !== undefined) {
        where.quantity.lte = maxQuantity;
      }
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          warehouse: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    // Get product details and apply search filter if needed
    let movementsWithProducts = await Promise.all(
      movements.map(async movement => {
        const product = await this.prisma.product.findUnique({
          where: { id: movement.productId },
          select: {
            name: true,
            sku: true,
            barcode: true,
          },
        });

        return {
          ...movement,
          product,
        };
      }),
    );

    // Apply search filter (across product name, SKU, warehouse, reference)
    if (search) {
      const searchLower = search.toLowerCase();
      movementsWithProducts = movementsWithProducts.filter(m =>
        m.product?.name?.toLowerCase().includes(searchLower) ||
        m.product?.sku?.toLowerCase().includes(searchLower) ||
        m.warehouse?.name?.toLowerCase().includes(searchLower) ||
        m.reference?.toLowerCase().includes(searchLower)
      );
    }

    return PaginationHelper.paginate(
      movementsWithProducts,
      search ? movementsWithProducts.length : total,
      page,
      limit
    );
  }

  // Get movements summary statistics
  async getMovementsSummary(tenantId: string, queryDto: any) {
    const {
      startDate,
      endDate,
      productId,
      warehouseId,
      type,
    } = queryDto;

    // Get products for this tenant
    const productIds = await this.prisma.product
      .findMany({
        where: { tenantId },
        select: { id: true },
      })
      .then(products => products.map(p => p.id));

    // Build where clause
    const where: any = {
      productId: { in: productIds },
    };

    // Apply filters
    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get all movements matching filters
    const movements = await this.prisma.stockMovement.findMany({
      where,
      select: {
        type: true,
        quantity: true,
      },
    });

    // Calculate statistics
    const summary = {
      openingStock: 0, // Would need historical data
      totalIn: movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + m.quantity, 0),
      totalOut: Math.abs(movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + m.quantity, 0)),
      totalTransferIn: movements
        .filter(m => m.type === 'TRANSFER' && m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0),
      totalTransferOut: Math.abs(movements
        .filter(m => m.type === 'TRANSFER' && m.quantity < 0)
        .reduce((sum, m) => sum + m.quantity, 0)),
      totalAdjustment: movements
        .filter(m => m.type === 'ADJUSTMENT')
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      totalDamage: Math.abs(movements
        .filter(m => m.type === 'DAMAGE')
        .reduce((sum, m) => sum + m.quantity, 0)),
      closingStock: 0, // Would need current stock data
      movementCount: movements.length,
    };

    return summary;
  }

  // Export movements to CSV
  async exportMovementsCSV(tenantId: string, queryDto: any) {
    // Get all movements (no pagination limit for export)
    const exportQuery = { ...queryDto, limit: 10000, page: 1 };
    const result = await this.getStockMovements(tenantId, exportQuery);
    const movements = result.data;

    // Generate CSV content
    const headers = [
      'Date & Time',
      'Product',
      'SKU',
      'Warehouse',
      'Type',
      'Quantity',
      'Balance After',
      'Reference',
      'User',
      'Reason'
    ];

    const rows = movements.map(m => [
      new Date(m.createdAt).toLocaleString(),
      m.product?.name || '-',
      m.product?.sku || '-',
      m.warehouse?.name || '-',
      m.type,
      m.quantity >= 0 ? `+${m.quantity}` : m.quantity.toString(),
      0,
      m.reference || '-',
      m.user ? `${m.user.firstName} ${m.user.lastName}` : '-',
      m.notes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    return {
      data: csvContent,
      filename: `movements-${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv'
    };
  }

  // Export movements to Excel
  async exportMovementsExcel(tenantId: string, queryDto: any) {
    // For now, return CSV format - can be enhanced with actual Excel library later
    const csvResult = await this.exportMovementsCSV(tenantId, queryDto);
    return {
      ...csvResult,
      filename: csvResult.filename.replace('.csv', '.xlsx'),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  // Get expiring batches
  async getExpiringBatches(tenantId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const products = await this.prisma.product.findMany({
      where: { tenantId, trackExpiry: true },
    });

    const productIds = products.map(p => p.id);

    const stocks = await this.prisma.stock.findMany({
      where: {
        productId: { in: productIds },
      },
      include: {
        batches: {
          where: {
            quantity: { gt: 0 },
            expiryDate: {
              lte: futureDate,
              gte: new Date(),
            },
          },
          orderBy: {
            expiryDate: 'asc',
          },
        },
        warehouse: {
          select: {
            name: true,
          },
        },
      },
    });

    const expiringBatches: any[] = [];

    for (const stock of stocks) {
      const product = products.find(p => p.id === stock.productId);
      for (const batch of stock.batches) {
        expiringBatches.push({
          product: {
            id: product?.id,
            name: product?.name,
            sku: product?.sku,
          },
          warehouse: stock.warehouse.name,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          daysUntilExpiry: Math.ceil(
            (batch.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          ),
        });
      }
    }

    return expiringBatches;
  }

  // Get all stock levels
  async getAllStock(tenantId: string, paginationDto: any) {
    try {
      const { page, limit, sortBy, sortOrder, search, productId, warehouseId, lowStock } = paginationDto;

      const where: any = {
        product: {
          tenantId,
        },
      };

      // Apply product filter
      if (productId) {
        where.productId = productId;
      }

      // Apply warehouse filter
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      // Apply search filter
      if (search) {
        where.OR = [
          { product: { name: { contains: search, mode: 'insensitive' } } },
          { product: { sku: { contains: search, mode: 'insensitive' } } },
          { warehouse: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Count total records
      const total = await this.prisma.stock.count({ where });

      // Get stock records with pagination
      const stocks = await this.prisma.stock.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              minStockLevel: true,
              unit: {
                select: {
                  name: true,
                  symbol: true,
                },
              },
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: sortBy ? { [sortBy]: sortOrder } : { updatedAt: 'desc' },
        ...PaginationHelper.getSkipTake(page || 1, limit || 20),
      });

      // Filter for low stock items if requested
      let filteredStocks = stocks;
      if (lowStock === true) {
        filteredStocks = stocks.filter(stock => {
          const minLevel = stock.product.minStockLevel || 0;
          return stock.available <= minLevel;
        });
      }

      return PaginationHelper.paginate(
        filteredStocks,
        lowStock ? filteredStocks.length : total,
        page || 1,
        limit || 20
      );
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      throw new BadRequestException('Failed to fetch stock levels');
    }
  }

  // Warehouse CRUD operations
  async createWarehouse(tenantId: string, createWarehouseDto: CreateWarehouseDto) {
    // Generate code if not provided
    let code = createWarehouseDto.code;
    if (!code) {
      // Generate code based on warehouse count
      const count = await this.prisma.warehouse.count({ where: { tenantId } });
      code = `WH-${String(count + 1).padStart(3, '0')}`;
    }

    // Check if warehouse with same code already exists
    const existing = await this.prisma.warehouse.findFirst({
      where: {
        code,
        tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('Warehouse with this code already exists');
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        ...createWarehouseDto,
        code,
        tenantId,
      },
    });

    return {
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
    };
  }

  async findAllWarehouses(tenantId: string, paginationDto: PaginationDto) {
    try {
      const { page, limit, sortBy, sortOrder, search } = paginationDto;

      const where: any = {
        tenantId,
      };

      // Apply search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Count total records
      const total = await this.prisma.warehouse.count({ where });

      // Get warehouses with pagination
      const warehouses = await this.prisma.warehouse.findMany({
        where,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        ...PaginationHelper.getSkipTake(page || 1, limit || 20),
      });

      return PaginationHelper.paginate(warehouses, total, page || 1, limit || 20);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new BadRequestException('Failed to fetch warehouses');
    }
  }

  async findOneWarehouse(id: string, tenantId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            stocks: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return {
      success: true,
      data: warehouse,
    };
  }

  async updateWarehouse(id: string, tenantId: string, updateWarehouseDto: UpdateWarehouseDto) {
    // Check if warehouse exists
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check if code is being updated and if it conflicts
    if (updateWarehouseDto.code && updateWarehouseDto.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findFirst({
        where: {
          code: updateWarehouseDto.code,
          tenantId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Warehouse with this code already exists');
      }
    }

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto,
    });

    return {
      success: true,
      data: updated,
      message: 'Warehouse updated successfully',
    };
  }

  async removeWarehouse(id: string, tenantId: string) {
    // Check if warehouse exists
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            stocks: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    // Check if warehouse has stock
    if (warehouse._count.stocks > 0) {
      throw new BadRequestException('Cannot delete warehouse with existing stock. Transfer or remove stock first.');
    }

    await this.prisma.warehouse.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Warehouse deleted successfully',
    };
  }
}

