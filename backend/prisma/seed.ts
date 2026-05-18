import {
  AccountSubType,
  AccountType,
  JournalType,
  LineType,
  MovementType,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PurchaseIndentStatus,
  PrismaClient,
  UserRole,
  UserStatus,
  WorkOrderStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const password = 'password123';
const tenantEmail = 'demo@invenzo.com';

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const lineTotal = (quantity: number, unitPrice: number, taxRate = 18, discount = 0) => {
  const subtotal = quantity * unitPrice - discount;
  const taxAmount = Number((subtotal * taxRate / 100).toFixed(2));
  return {
    taxAmount,
    total: Number((subtotal + taxAmount).toFixed(2)),
  };
};

async function clearDemoData(tenantId: string) {
  await prisma.customerPayment.deleteMany({ where: { tenantId } });
  await prisma.vendorPayment.deleteMany({ where: { tenantId } });
  await prisma.salesInvoice.deleteMany({ where: { tenantId } });
  await prisma.purchaseInvoice.deleteMany({ where: { tenantId } });
  await prisma.deliveryItem.deleteMany({ where: { deliveryNote: { salesOrder: { tenantId } } } });
  await prisma.deliveryNote.deleteMany({ where: { salesOrder: { tenantId } } });
  await prisma.goodsReceivedItem.deleteMany({ where: { grn: { purchaseOrder: { tenantId } } } });
  await prisma.goodsReceivedNote.deleteMany({ where: { purchaseOrder: { tenantId } } });
  await prisma.salesOrderItem.deleteMany({ where: { salesOrder: { tenantId } } });
  await prisma.salesOrder.deleteMany({ where: { tenantId } });
  await prisma.quotationItem.deleteMany({ where: { quotation: { tenantId } } });
  await prisma.quotation.deleteMany({ where: { tenantId } });
  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { tenantId } } });
  await prisma.purchaseOrder.deleteMany({ where: { tenantId } });
  await prisma.purchaseIndent.deleteMany({ where: { tenantId } });
  await prisma.workOrderMaterial.deleteMany({ where: { workOrder: { tenantId } } });
  await prisma.workOrder.deleteMany({ where: { tenantId } });
  await prisma.routingStep.deleteMany({ where: { bom: { tenantId } } });
  await prisma.bomItem.deleteMany({ where: { bom: { tenantId } } });
  await prisma.billOfMaterial.deleteMany({ where: { tenantId } });
  await prisma.journalLine.deleteMany({ where: { journal: { tenantId } } });
  await prisma.journalEntry.deleteMany({ where: { tenantId } });
  await prisma.ledgerAccount.deleteMany({ where: { tenantId } });
  await prisma.accountGroup.deleteMany({ where: { tenantId } });
  await prisma.stockMovement.deleteMany({ where: { user: { tenantId } } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.notification.deleteMany({ where: { tenantId } });
  await prisma.batch.deleteMany({ where: { stock: { product: { tenantId } } } });
  await prisma.serial.deleteMany({ where: { stock: { product: { tenantId } } } });
  await prisma.stock.deleteMany({ where: { product: { tenantId } } });
  await prisma.productVariant.deleteMany({ where: { product: { tenantId } } });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });
  await prisma.vendor.deleteMany({ where: { tenantId } });
  await prisma.category.deleteMany({ where: { tenantId } });
  await prisma.brand.deleteMany({ where: { tenantId } });
  await prisma.unit.deleteMany({ where: { tenantId } });
  await prisma.warehouse.deleteMany({ where: { tenantId } });
  await prisma.companySettings.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
}

async function main() {
  console.log('Starting Invenzo demo seed...');

  const hashedPassword = await bcrypt.hash(password, 10);

  const tenant = await prisma.tenant.upsert({
    where: { email: tenantEmail },
    update: {
      name: 'Invenzo Demo Operations Pvt Ltd',
      phone: '+91 98765 43210',
      address: 'Level 8, Orion Business Park, Mumbai',
      gstNumber: '27AAECI2468F1Z3',
      settings: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata',
      },
      isActive: true,
    },
    create: {
      name: 'Invenzo Demo Operations Pvt Ltd',
      email: tenantEmail,
      phone: '+91 98765 43210',
      address: 'Level 8, Orion Business Park, Mumbai',
      gstNumber: '27AAECI2468F1Z3',
      settings: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata',
      },
    },
  });

  await clearDemoData(tenant.id);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@invenzo.com' },
    update: {
      tenantId: tenant.id,
      password: hashedPassword,
      firstName: 'Rahul',
      lastName: 'Owner',
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'owner@invenzo.com',
      password: hashedPassword,
      firstName: 'Rahul',
      lastName: 'Owner',
      phone: '+91 98765 43211',
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@invenzo.com' },
    update: {
      tenantId: tenant.id,
      password: hashedPassword,
      firstName: 'Nisha',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'manager@invenzo.com',
      password: hashedPassword,
      firstName: 'Nisha',
      lastName: 'Manager',
      phone: '+91 98765 43212',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@invenzo.com' },
    update: {
      tenantId: tenant.id,
      password: hashedPassword,
      firstName: 'Arjun',
      lastName: 'Staff',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'staff@invenzo.com',
      password: hashedPassword,
      firstName: 'Arjun',
      lastName: 'Staff',
      phone: '+91 98765 43213',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'accounts@invenzo.com' },
    update: {
      tenantId: tenant.id,
      password: hashedPassword,
      firstName: 'Meera',
      lastName: 'Accounts',
      role: UserRole.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'accounts@invenzo.com',
      password: hashedPassword,
      firstName: 'Meera',
      lastName: 'Accounts',
      phone: '+91 98765 43214',
      role: UserRole.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  await prisma.companySettings.create({
    data: {
      tenantId: tenant.id,
      name: 'Invenzo Demo Operations Pvt Ltd',
      email: tenantEmail,
      phone: '+91 98765 43210',
      website: 'https://invenzo.local',
      address: 'Level 8, Orion Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400059',
      taxId: '27AAECI2468F1Z3',
      currency: 'INR',
    },
  });

  const [mainWarehouse, northWarehouse, southWarehouse] = await Promise.all([
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        name: 'Mumbai Fulfilment Hub',
        code: 'WH-MUM',
        address: 'Saki Vihar Road, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400072',
        phone: '+91 22 4000 1100',
        email: 'mum-warehouse@invenzo.com',
      },
    }),
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        name: 'Delhi Distribution Centre',
        code: 'WH-DEL',
        address: 'Okhla Industrial Area',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110020',
      },
    }),
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        name: 'Bengaluru Service Store',
        code: 'WH-BLR',
        address: 'Peenya Industrial Estate',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560058',
      },
    }),
  ]);

  const [devices, accessories, spares, packaging] = await Promise.all([
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Devices', description: 'Finished devices ready for sale' } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Accessories', description: 'Attach-rate accessories and add-ons' } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Service Spares', description: 'Replacement parts for service orders' } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Packaging', description: 'Packaging and shipping consumables' } }),
  ]);

  const [invenzo, lenovo, hp, logitech] = await Promise.all([
    prisma.brand.create({ data: { tenantId: tenant.id, name: 'Invenzo Select', description: 'House curated operations hardware' } }),
    prisma.brand.create({ data: { tenantId: tenant.id, name: 'Lenovo', description: 'Commercial laptops and desktops' } }),
    prisma.brand.create({ data: { tenantId: tenant.id, name: 'HP', description: 'Enterprise devices' } }),
    prisma.brand.create({ data: { tenantId: tenant.id, name: 'Logitech', description: 'Input devices and collaboration accessories' } }),
  ]);

  const [piece, box, roll] = await Promise.all([
    prisma.unit.create({ data: { tenantId: tenant.id, name: 'Piece', symbol: 'pcs' } }),
    prisma.unit.create({ data: { tenantId: tenant.id, name: 'Box', symbol: 'box' } }),
    prisma.unit.create({ data: { tenantId: tenant.id, name: 'Roll', symbol: 'roll' } }),
  ]);

  const productSeeds = [
    ['INV-LAP-14PRO', 'Invenzo OpsBook 14 Pro', devices.id, invenzo.id, piece.id, 46500, 62500, 18, 12],
    ['LEN-T14-I5', 'Lenovo ThinkPad T14 i5', devices.id, lenovo.id, piece.id, 58500, 74900, 18, 8],
    ['HP-ELITE-840', 'HP EliteBook 840 G10', devices.id, hp.id, piece.id, 64000, 81900, 18, 6],
    ['LOGI-MXKEYS', 'Logitech MX Keys Business', accessories.id, logitech.id, piece.id, 7200, 10490, 18, 15],
    ['LOGI-MXMOUSE', 'Logitech MX Master 3S', accessories.id, logitech.id, piece.id, 6100, 9290, 18, 15],
    ['INV-DOCK-C', 'Invenzo USB-C Dock 11-in-1', accessories.id, invenzo.id, piece.id, 3900, 6490, 18, 20],
    ['INV-BATT-14', 'OpsBook 14 Battery Pack', spares.id, invenzo.id, piece.id, 2100, 3600, 18, 10],
    ['SHIP-CARTON-M', 'Medium Shipping Carton', packaging.id, invenzo.id, box.id, 420, 780, 18, 25],
    ['THERMAL-LABEL', 'Thermal Shipping Label Roll', packaging.id, invenzo.id, roll.id, 260, 520, 18, 20],
  ] as const;

  const products = await Promise.all(
    productSeeds.map(([sku, name, categoryId, brandId, unitId, costPrice, sellingPrice, taxRate, minStockLevel]) =>
      prisma.product.create({
        data: {
          tenantId: tenant.id,
          sku,
          name,
          categoryId,
          brandId,
          unitId,
          costPrice,
          sellingPrice,
          mrp: Math.round(Number(sellingPrice) * 1.08),
          taxRate,
          minStockLevel,
          reorderLevel: minStockLevel + 6,
          maxStockLevel: minStockLevel * 8,
          description: `${name} for B2B inventory operations.`,
        },
      }),
    ),
  );

  const bySku = Object.fromEntries(products.map(product => [product.sku, product]));

  const stockRows = [
    ['INV-LAP-14PRO', mainWarehouse.id, 42, 6],
    ['INV-LAP-14PRO', northWarehouse.id, 11, 2],
    ['LEN-T14-I5', mainWarehouse.id, 18, 3],
    ['LEN-T14-I5', southWarehouse.id, 5, 1],
    ['HP-ELITE-840', mainWarehouse.id, 9, 2],
    ['LOGI-MXKEYS', mainWarehouse.id, 65, 10],
    ['LOGI-MXMOUSE', northWarehouse.id, 31, 4],
    ['INV-DOCK-C', mainWarehouse.id, 22, 3],
    ['INV-BATT-14', southWarehouse.id, 7, 1],
    ['SHIP-CARTON-M', mainWarehouse.id, 180, 0],
    ['THERMAL-LABEL', mainWarehouse.id, 12, 0],
  ] as const;

  await Promise.all(
    stockRows.map(([sku, warehouseId, quantity, reserved]) =>
      prisma.stock.create({
        data: {
          productId: bySku[sku].id,
          warehouseId,
          quantity,
          reserved,
          available: quantity - reserved,
        },
      }),
    ),
  );

  await Promise.all(
    stockRows.slice(0, 8).map(([sku, warehouseId, quantity]) =>
      prisma.stockMovement.create({
        data: {
          warehouseId,
          productId: bySku[sku].id,
          type: MovementType.IN,
          quantity,
          reference: 'OPENING-STOCK',
          notes: 'Opening stock loaded from demo seed',
          createdBy: owner.id,
          createdAt: daysFromNow(-18),
        },
      }),
    ),
  );

  const laptopBom = await prisma.billOfMaterial.create({
    data: {
      tenantId: tenant.id,
      bomNumber: 'BOM-2026-0001',
      productId: bySku['INV-LAP-14PRO'].id,
      name: 'OpsBook 14 Pro Final Assembly',
      version: '1.0',
      outputQty: 1,
      createdBy: owner.id,
      notes: 'Demo BOM for TranZact-style production planning',
      items: {
        create: [
          {
            materialId: bySku['INV-BATT-14'].id,
            quantity: 1,
            wastagePercent: 2,
            notes: 'Battery pack issued during assembly',
          },
          {
            materialId: bySku['SHIP-CARTON-M'].id,
            quantity: 1,
            wastagePercent: 1,
            notes: 'Finished goods packaging',
          },
          {
            materialId: bySku['THERMAL-LABEL'].id,
            quantity: 0.05,
            wastagePercent: 0,
            notes: 'Shipping label consumption per unit',
          },
        ],
      },
      routingSteps: {
        create: [
          {
            sequence: 1,
            processName: 'Kitting',
            workCenter: 'Mumbai Assembly Store',
            estimatedMinutes: 20,
            instructions: 'Pick battery, carton, label, and finished device kit.',
          },
          {
            sequence: 2,
            processName: 'Final QA',
            workCenter: 'Quality Bench',
            estimatedMinutes: 35,
            instructions: 'Run power, display, port, and packaging checklist.',
          },
          {
            sequence: 3,
            processName: 'Packing',
            workCenter: 'Dispatch Line',
            estimatedMinutes: 15,
            instructions: 'Pack, label, and move finished goods to dispatch-ready stock.',
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: tenant.id,
      workOrderNumber: 'WO-2026-0001',
      bomId: laptopBom.id,
      productId: bySku['INV-LAP-14PRO'].id,
      warehouseId: mainWarehouse.id,
      plannedQty: 10,
      producedQty: 6,
      rejectedQty: 1,
      status: WorkOrderStatus.IN_PROGRESS,
      plannedStart: daysFromNow(-2),
      dueDate: daysFromNow(4),
      createdBy: owner.id,
      notes: 'Demo work order showing WIP and rejection tracking',
      materials: {
        create: laptopBom.items.map(item => ({
          productId: item.materialId,
          plannedQty: Number(item.quantity) * 10 * (1 + Number(item.wastagePercent) / 100),
          issuedQty: Number(item.quantity) * 6,
          consumedQty: Number(item.quantity) * 5,
        })),
      },
    },
  });

  const dockBom = await prisma.billOfMaterial.create({
    data: {
      tenantId: tenant.id,
      bomNumber: 'BOM-2026-0002',
      productId: bySku['INV-DOCK-C'].id,
      name: 'USB-C Dock Packing Kit',
      version: '1.1',
      outputQty: 1,
      createdBy: owner.id,
      notes: 'Accessory packing BOM for dispatch-ready dock kits',
      items: {
        create: [
          {
            materialId: bySku['SHIP-CARTON-M'].id,
            quantity: 0.5,
            wastagePercent: 1,
            notes: 'Shared carton capacity for two dock units',
          },
          {
            materialId: bySku['THERMAL-LABEL'].id,
            quantity: 0.03,
            wastagePercent: 0,
            notes: 'Serialized dispatch label',
          },
        ],
      },
      routingSteps: {
        create: [
          {
            sequence: 1,
            processName: 'Accessory Kitting',
            workCenter: 'Mumbai Accessories Cell',
            estimatedMinutes: 12,
            instructions: 'Verify cable, dock, and carton availability.',
          },
          {
            sequence: 2,
            processName: 'Dispatch Labeling',
            workCenter: 'Dispatch Line',
            estimatedMinutes: 8,
            instructions: 'Apply labels and scan into finished goods staging.',
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: tenant.id,
      workOrderNumber: 'WO-2026-0002',
      bomId: dockBom.id,
      productId: bySku['INV-DOCK-C'].id,
      warehouseId: mainWarehouse.id,
      plannedQty: 24,
      producedQty: 0,
      rejectedQty: 0,
      status: WorkOrderStatus.PLANNED,
      plannedStart: daysFromNow(1),
      dueDate: daysFromNow(6),
      createdBy: owner.id,
      notes: 'Planned dock kit production for upcoming sales orders',
      materials: {
        create: dockBom.items.map(item => ({
          productId: item.materialId,
          plannedQty: Number(item.quantity) * 24 * (1 + Number(item.wastagePercent) / 100),
        })),
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      tenantId: tenant.id,
      workOrderNumber: 'WO-2026-0003',
      bomId: laptopBom.id,
      productId: bySku['INV-LAP-14PRO'].id,
      warehouseId: mainWarehouse.id,
      plannedQty: 8,
      producedQty: 8,
      rejectedQty: 0,
      status: WorkOrderStatus.COMPLETED,
      plannedStart: daysFromNow(-12),
      dueDate: daysFromNow(-6),
      completedAt: daysFromNow(-6),
      createdBy: owner.id,
      notes: 'Completed laptop assembly order for production history',
      materials: {
        create: laptopBom.items.map(item => ({
          productId: item.materialId,
          plannedQty: Number(item.quantity) * 8 * (1 + Number(item.wastagePercent) / 100),
          issuedQty: Number(item.quantity) * 8,
          consumedQty: Number(item.quantity) * 8,
        })),
      },
    },
  });

  const [vendorA, vendorB, vendorC] = await Promise.all([
    prisma.vendor.create({
      data: {
        tenantId: tenant.id,
        code: 'VEN-001',
        name: 'Northstar Tech Distributors',
        email: 'orders@northstar.example',
        phone: '+91 98100 10001',
        address: 'Nehru Place',
        city: 'New Delhi',
        state: 'Delhi',
        gstNumber: '07AABCN2468F1Z8',
        creditLimit: 900000,
        creditDays: 30,
      },
    }),
    prisma.vendor.create({
      data: {
        tenantId: tenant.id,
        code: 'VEN-002',
        name: 'Western Components Supply',
        email: 'sales@western-components.example',
        phone: '+91 98200 22002',
        address: 'MIDC Andheri',
        city: 'Mumbai',
        state: 'Maharashtra',
        gstNumber: '27AACFW1357Q1Z4',
        creditLimit: 650000,
        creditDays: 21,
      },
    }),
    prisma.vendor.create({
      data: {
        tenantId: tenant.id,
        code: 'VEN-003',
        name: 'PackRight Industrial',
        email: 'support@packright.example',
        phone: '+91 98450 33003',
        address: 'Peenya Phase 2',
        city: 'Bengaluru',
        state: 'Karnataka',
        gstNumber: '29AADCP9753M1Z2',
        creditLimit: 250000,
        creditDays: 15,
      },
    }),
  ]);

  const [customerA, customerB, customerC, customerD] = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-001',
        name: 'Apex Retail Systems',
        email: 'procurement@apexretail.example',
        phone: '+91 99800 40001',
        address: 'MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        gstNumber: '29AAECA4321M1Z7',
        creditLimit: 450000,
        creditDays: 20,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-002',
        name: 'Meridian Field Services',
        email: 'ops@meridianfield.example',
        phone: '+91 98700 40002',
        address: 'Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        gstNumber: '27AAECM2468C1Z6',
        creditLimit: 350000,
        creditDays: 15,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-003',
        name: 'Nexus Workspaces',
        email: 'it@nexuswork.example',
        phone: '+91 98110 40003',
        address: 'Cyber City',
        city: 'Gurugram',
        state: 'Haryana',
        gstNumber: '06AAFCN4321B1Z5',
        creditLimit: 600000,
        creditDays: 30,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-004',
        name: 'UrbanKart Commerce',
        email: 'finance@urbankart.example',
        phone: '+91 98880 40004',
        address: 'Salt Lake Sector V',
        city: 'Kolkata',
        state: 'West Bengal',
        gstNumber: '19AAACU9753E1Z1',
        creditLimit: 300000,
        creditDays: 12,
      },
    }),
  ]);

  const createPurchaseOrder = async (
    poNumber: string,
    vendorId: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
    rows: Array<[string, number, number]>,
    paidAmount = 0,
  ) => {
    const totals = rows.map(([sku, quantity, unitPrice]) => lineTotal(quantity, unitPrice, Number(bySku[sku].taxRate)));
    const subtotal = rows.reduce((sum, [, quantity, unitPrice]) => sum + quantity * unitPrice, 0);
    const taxAmount = totals.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = totals.reduce((sum, item) => sum + item.total, 0);

    return prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        poNumber,
        vendorId,
        orderDate: daysFromNow(-14),
        expectedDate: daysFromNow(5),
        status,
        paymentStatus,
        subtotal,
        taxAmount,
        total,
        paidAmount,
        createdBy: owner.id,
        notes: 'Seeded purchase order for demo inventory flow',
        items: {
          create: rows.map(([sku, quantity, unitPrice], index) => ({
            productId: bySku[sku].id,
            quantity,
            receivedQty: status === OrderStatus.COMPLETED ? quantity : Math.floor(quantity / 2),
            unitPrice,
            taxRate: bySku[sku].taxRate,
            taxAmount: totals[index].taxAmount,
            total: totals[index].total,
          })),
        },
      },
      include: { items: true },
    });
  };

  const po1 = await createPurchaseOrder('PO-2026-0001', vendorA.id, OrderStatus.COMPLETED, PaymentStatus.PAID, [
    ['LEN-T14-I5', 12, 57500],
    ['LOGI-MXKEYS', 24, 6900],
  ], 980528);

  const po2 = await createPurchaseOrder('PO-2026-0002', vendorB.id, OrderStatus.CONFIRMED, PaymentStatus.PARTIAL, [
    ['INV-DOCK-C', 30, 3800],
    ['INV-BATT-14', 18, 2050],
  ], 50000);

  await createPurchaseOrder('PO-2026-0003', vendorC.id, OrderStatus.PROCESSING, PaymentStatus.PENDING, [
    ['SHIP-CARTON-M', 100, 410],
    ['THERMAL-LABEL', 80, 250],
  ]);

  await prisma.purchaseIndent.createMany({
    data: [
      {
        tenantId: tenant.id,
        indentNumber: 'IND-2026-0001',
        productId: bySku['INV-BATT-14'].id,
        requiredQty: 30,
        availableQty: 7,
        shortageQty: 23,
        sourceType: 'MRP',
        sourceReference: 'SO-2026-0002 / BOM-2026-0001',
        requiredBy: daysFromNow(7),
        status: PurchaseIndentStatus.OPEN,
        notes: 'MRP shortage for upcoming assembly demand',
        createdBy: owner.id,
      },
      {
        tenantId: tenant.id,
        indentNumber: 'IND-2026-0002',
        productId: bySku['THERMAL-LABEL'].id,
        requiredQty: 20,
        availableQty: 12,
        shortageQty: 8,
        sourceType: 'MRP',
        sourceReference: 'Packaging reorder plan',
        requiredBy: daysFromNow(5),
        status: PurchaseIndentStatus.APPROVED,
        notes: 'Approved replenishment indent for packaging labels',
        createdBy: owner.id,
      },
    ],
  });

  const grn1 = await prisma.goodsReceivedNote.create({
    data: {
      grnNumber: 'GRN-2026-0001',
      purchaseOrderId: po1.id,
      warehouseId: mainWarehouse.id,
      receivedBy: owner.id,
      receivedDate: daysFromNow(-9),
      notes: 'All items received in good condition',
      items: {
        create: po1.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          batchNumber: `BATCH-${item.id.slice(0, 6).toUpperCase()}`,
        })),
      },
    },
  });

  const purchaseInvoice = await prisma.purchaseInvoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'PINV-2026-0001',
      purchaseOrderId: po1.id,
      grnId: grn1.id,
      vendorId: vendorA.id,
      invoiceDate: daysFromNow(-8),
      dueDate: daysFromNow(12),
      status: PaymentStatus.PAID,
      subtotal: po1.subtotal,
      taxAmount: po1.taxAmount,
      total: po1.total,
      paidAmount: po1.total,
      balanceAmount: 0,
      createdBy: owner.id,
    },
  });

  await prisma.vendorPayment.create({
    data: {
      tenantId: tenant.id,
      vendorId: vendorA.id,
      invoiceId: purchaseInvoice.id,
      paymentNumber: 'VPAY-2026-0001',
      paymentDate: daysFromNow(-6),
      amount: purchaseInvoice.total,
      method: PaymentMethod.BANK_TRANSFER,
      reference: 'UTR-DEMO-001',
      createdBy: owner.id,
    },
  });

  const grn2 = await prisma.goodsReceivedNote.create({
    data: {
      grnNumber: 'GRN-2026-0002',
      purchaseOrderId: po2.id,
      warehouseId: mainWarehouse.id,
      receivedBy: owner.id,
      receivedDate: daysFromNow(-4),
      notes: 'Partial receipt for accessories and service parts',
      items: {
        create: po2.items.map(item => ({
          productId: item.productId,
          quantity: Math.max(1, Math.floor(item.quantity / 2)),
          batchNumber: `PART-${item.id.slice(0, 6).toUpperCase()}`,
        })),
      },
    },
  });

  const partialPurchaseInvoiceTotal = Number(po2.total);
  const partialPurchasePaid = 50000;
  const partialPurchaseInvoice = await prisma.purchaseInvoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'PINV-2026-0002',
      purchaseOrderId: po2.id,
      grnId: grn2.id,
      vendorId: vendorB.id,
      invoiceDate: daysFromNow(-3),
      dueDate: daysFromNow(18),
      status: PaymentStatus.PARTIAL,
      subtotal: po2.subtotal,
      taxAmount: po2.taxAmount,
      total: po2.total,
      paidAmount: partialPurchasePaid,
      balanceAmount: partialPurchaseInvoiceTotal - partialPurchasePaid,
      createdBy: owner.id,
      notes: 'Partially paid purchase invoice for payable ageing and payment flow',
    },
  });

  await prisma.vendorPayment.create({
    data: {
      tenantId: tenant.id,
      vendorId: vendorB.id,
      invoiceId: partialPurchaseInvoice.id,
      paymentNumber: 'VPAY-2026-0002',
      paymentDate: daysFromNow(-2),
      amount: partialPurchasePaid,
      method: PaymentMethod.BANK_TRANSFER,
      reference: 'UTR-DEMO-002',
      notes: 'Advance payment against partial vendor invoice',
      createdBy: owner.id,
    },
  });

  const createQuotation = async (quotationNumber: string, customerId: string, rows: Array<[string, number]>) => {
    const subtotal = rows.reduce((sum, [sku, quantity]) => sum + quantity * Number(bySku[sku].sellingPrice), 0);
    const taxAmount = Number((subtotal * 0.18).toFixed(2));
    return prisma.quotation.create({
      data: {
        tenantId: tenant.id,
        quotationNumber,
        customerId,
        quotationDate: daysFromNow(-7),
        validUntil: daysFromNow(23),
        status: OrderStatus.CONFIRMED,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        termsConditions: 'Prices valid for 30 days. Delivery subject to stock availability.',
        createdBy: owner.id,
        items: {
          create: rows.map(([sku, quantity]) => {
            const price = Number(bySku[sku].sellingPrice);
            const tax = lineTotal(quantity, price, 18);
            return {
              productId: bySku[sku].id,
              quantity,
              unitPrice: price,
              taxRate: 18,
              taxAmount: tax.taxAmount,
              total: tax.total,
            };
          }),
        },
      },
    });
  };

  await createQuotation('QT-2026-0001', customerA.id, [['INV-LAP-14PRO', 5], ['INV-DOCK-C', 5]]);
  await createQuotation('QT-2026-0002', customerC.id, [['HP-ELITE-840', 4], ['LOGI-MXMOUSE', 8]]);

  const createSalesOrder = async (
    soNumber: string,
    customerId: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
    rows: Array<[string, number]>,
    paidAmount = 0,
  ) => {
    const subtotal = rows.reduce((sum, [sku, quantity]) => sum + quantity * Number(bySku[sku].sellingPrice), 0);
    const taxAmount = Number((subtotal * 0.18).toFixed(2));
    const total = subtotal + taxAmount;

    return prisma.salesOrder.create({
      data: {
        tenantId: tenant.id,
        soNumber,
        customerId,
        orderDate: daysFromNow(-5),
        deliveryDate: daysFromNow(3),
        status,
        paymentStatus,
        subtotal,
        taxAmount,
        total,
        paidAmount,
        createdBy: owner.id,
        notes: 'Seeded sales order for demo workflow',
        items: {
          create: rows.map(([sku, quantity]) => {
            const price = Number(bySku[sku].sellingPrice);
            const tax = lineTotal(quantity, price, 18);
            return {
              productId: bySku[sku].id,
              quantity,
              deliveredQty: status === OrderStatus.COMPLETED ? quantity : 0,
              unitPrice: price,
              taxRate: 18,
              taxAmount: tax.taxAmount,
              total: tax.total,
            };
          }),
        },
      },
      include: { items: true },
    });
  };

  const so1 = await createSalesOrder('SO-2026-0001', customerA.id, OrderStatus.COMPLETED, PaymentStatus.PAID, [
    ['INV-LAP-14PRO', 3],
    ['INV-DOCK-C', 3],
  ], 244572);

  const so2 = await createSalesOrder('SO-2026-0002', customerB.id, OrderStatus.CONFIRMED, PaymentStatus.PARTIAL, [
    ['LOGI-MXKEYS', 10],
    ['LOGI-MXMOUSE', 10],
  ], 75000);

  await createSalesOrder('SO-2026-0003', customerD.id, OrderStatus.PROCESSING, PaymentStatus.PENDING, [
    ['SHIP-CARTON-M', 35],
    ['THERMAL-LABEL', 12],
  ]);

  const delivery = await prisma.deliveryNote.create({
    data: {
      deliveryNumber: 'DN-2026-0001',
      salesOrderId: so1.id,
      warehouseId: mainWarehouse.id,
      deliveredBy: owner.id,
      deliveryDate: daysFromNow(-3),
      notes: 'Delivered through demo logistics partner',
      items: {
        create: so1.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
  });

  const salesInvoice = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'SINV-2026-0001',
      salesOrderId: so1.id,
      deliveryNoteId: delivery.id,
      customerId: customerA.id,
      invoiceDate: daysFromNow(-2),
      dueDate: daysFromNow(13),
      status: PaymentStatus.PAID,
      subtotal: so1.subtotal,
      taxAmount: so1.taxAmount,
      total: so1.total,
      paidAmount: so1.total,
      balanceAmount: 0,
      createdBy: owner.id,
    },
  });

  await prisma.customerPayment.create({
    data: {
      tenantId: tenant.id,
      customerId: customerA.id,
      invoiceId: salesInvoice.id,
      paymentNumber: 'CPAY-2026-0001',
      paymentDate: daysFromNow(-1),
      amount: salesInvoice.total,
      method: PaymentMethod.UPI,
      reference: 'UPI-DEMO-001',
      createdBy: owner.id,
    },
  });

  const partialSalesInvoiceTotal = Number(so2.total);
  const partialSalesPaid = 75000;
  const partialSalesInvoice = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'SINV-2026-0002',
      salesOrderId: so2.id,
      customerId: customerB.id,
      invoiceDate: daysFromNow(-1),
      dueDate: daysFromNow(10),
      status: PaymentStatus.PARTIAL,
      subtotal: so2.subtotal,
      taxAmount: so2.taxAmount,
      total: so2.total,
      paidAmount: partialSalesPaid,
      balanceAmount: partialSalesInvoiceTotal - partialSalesPaid,
      createdBy: owner.id,
      notes: 'Partially paid sales invoice for receivable ageing and payment flow',
    },
  });

  await prisma.customerPayment.create({
    data: {
      tenantId: tenant.id,
      customerId: customerB.id,
      invoiceId: partialSalesInvoice.id,
      paymentNumber: 'CPAY-2026-0002',
      paymentDate: daysFromNow(0),
      amount: partialSalesPaid,
      method: PaymentMethod.BANK_TRANSFER,
      reference: 'NEFT-DEMO-002',
      notes: 'Partial collection against confirmed sales order',
      createdBy: owner.id,
    },
  });

  const assetGroup = await prisma.accountGroup.create({
    data: { tenantId: tenant.id, name: 'Current Assets', code: '1000', type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, isSystem: true },
  });
  const liabilityGroup = await prisma.accountGroup.create({
    data: { tenantId: tenant.id, name: 'Current Liabilities', code: '2000', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, isSystem: true },
  });
  const incomeGroup = await prisma.accountGroup.create({
    data: { tenantId: tenant.id, name: 'Sales Revenue', code: '4000', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, isSystem: true },
  });
  const expenseGroup = await prisma.accountGroup.create({
    data: { tenantId: tenant.id, name: 'Cost of Goods Sold', code: '5000', type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD, isSystem: true },
  });

  const cash = await prisma.ledgerAccount.create({
    data: { tenantId: tenant.id, groupId: assetGroup.id, name: 'Bank Account', code: '1001', type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, openingBalance: 350000, currentBalance: 594572, isSystem: true },
  });
  const receivables = await prisma.ledgerAccount.create({
    data: { tenantId: tenant.id, groupId: assetGroup.id, name: 'Accounts Receivable', code: '1002', type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, openingBalance: 125000, currentBalance: 284120, isSystem: true },
  });
  const payables = await prisma.ledgerAccount.create({
    data: { tenantId: tenant.id, groupId: liabilityGroup.id, name: 'Accounts Payable', code: '2001', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, openingBalance: 85000, currentBalance: 171420, isSystem: true },
  });
  const sales = await prisma.ledgerAccount.create({
    data: { tenantId: tenant.id, groupId: incomeGroup.id, name: 'Product Sales', code: '4001', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, currentBalance: 207264, isSystem: true },
  });
  const cogs = await prisma.ledgerAccount.create({
    data: { tenantId: tenant.id, groupId: expenseGroup.id, name: 'Inventory Cost', code: '5001', type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD, currentBalance: 151800, isSystem: true },
  });

  await prisma.journalEntry.create({
    data: {
      tenantId: tenant.id,
      journalNumber: 'JV-2026-0001',
      type: JournalType.SALES_INVOICE,
      date: daysFromNow(-2),
      reference: 'SINV-2026-0001',
      referenceId: salesInvoice.id,
      narration: 'Sales invoice generated for Apex Retail Systems',
      totalDebit: salesInvoice.total,
      totalCredit: salesInvoice.total,
      createdBy: owner.id,
      lines: {
        create: [
          { accountId: receivables.id, type: LineType.DEBIT, amount: salesInvoice.total, narration: 'Customer receivable' },
          { accountId: sales.id, type: LineType.CREDIT, amount: salesInvoice.total, narration: 'Product sales revenue' },
        ],
      },
    },
  });

  await prisma.journalEntry.create({
    data: {
      tenantId: tenant.id,
      journalNumber: 'JV-2026-0002',
      type: JournalType.PURCHASE_PAYMENT,
      date: daysFromNow(-6),
      reference: 'VPAY-2026-0001',
      narration: 'Vendor payment to Northstar Tech Distributors',
      totalDebit: purchaseInvoice.total,
      totalCredit: purchaseInvoice.total,
      createdBy: owner.id,
      lines: {
        create: [
          { accountId: payables.id, type: LineType.DEBIT, amount: purchaseInvoice.total, narration: 'Clear vendor payable' },
          { accountId: cash.id, type: LineType.CREDIT, amount: purchaseInvoice.total, narration: 'Bank transfer' },
        ],
      },
    },
  });

  await prisma.journalEntry.create({
    data: {
      tenantId: tenant.id,
      journalNumber: 'JV-2026-0003',
      type: JournalType.STOCK_ADJUSTMENT,
      date: daysFromNow(-4),
      reference: 'COGS-DEMO',
      narration: 'Recognize cost of goods for fulfilled demo order',
      totalDebit: 151800,
      totalCredit: 151800,
      createdBy: owner.id,
      lines: {
        create: [
          { accountId: cogs.id, type: LineType.DEBIT, amount: 151800, narration: 'Inventory cost consumed' },
          { accountId: cash.id, type: LineType.CREDIT, amount: 151800, narration: 'Inventory carrying value reduction' },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: NotificationType.LOW_STOCK,
        title: 'Low stock: Thermal Shipping Label Roll',
        message: 'Only 12 rolls are available in Mumbai Fulfilment Hub.',
        data: { sku: 'THERMAL-LABEL', warehouse: 'WH-MUM' },
      },
      {
        tenantId: tenant.id,
        type: NotificationType.PAYMENT_REMINDER,
        title: 'Payment due soon',
        message: 'Partial payment is pending for SO-2026-0002.',
        data: { order: 'SO-2026-0002' },
      },
      {
        tenantId: tenant.id,
        type: NotificationType.ORDER_UPDATE,
        title: 'Purchase order confirmed',
        message: 'PO-2026-0002 is confirmed and awaiting remaining goods.',
        data: { order: 'PO-2026-0002' },
      },
    ],
  });

  console.log('Demo seed completed.');
  console.log('');
  console.log('Demo credentials:');
  console.log(`Owner: owner@invenzo.com / ${password}`);
  console.log(`Manager: manager@invenzo.com / ${password}`);
  console.log(`Staff: staff@invenzo.com / ${password}`);
  console.log(`Accountant: accounts@invenzo.com / ${password}`);
}

main()
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
