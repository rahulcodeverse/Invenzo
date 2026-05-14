import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { email: 'demo@invenzo.com' },
    update: {},
    create: {
      name: 'Demo Company Pvt Ltd',
      email: 'demo@invenzo.com',
      phone: '+91 9876543210',
      address: '123 Business Street, Tech Park',
      gstNumber: '29ABCDE1234F1Z5',
      settings: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata',
      },
    },
  });

  console.log('✅ Tenant created:', tenant.name);

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@invenzo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@invenzo.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+91 9876543210',
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@invenzo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@invenzo.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+91 9876543211',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@invenzo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'staff@invenzo.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+91 9876543212',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  console.log('✅ Users created: Owner, Manager, Staff');

  // Create warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      address: '456 Storage Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 9876543220',
      email: 'warehouse@invenzo.com',
    },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Secondary Warehouse',
      code: 'WH-SEC',
      address: '789 Logistics Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    },
  });

  console.log('✅ Warehouses created');

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Electronics',
      description: 'Electronic items and gadgets',
    },
  });

  const laptops = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Laptops',
      description: 'Laptop computers',
      parentId: electronics.id,
    },
  });

  const clothing = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Clothing',
      description: 'Apparel and garments',
    },
  });

  console.log('✅ Categories created');

  // Create brands
  const dell = await prisma.brand.create({
    data: {
      tenantId: tenant.id,
      name: 'Dell',
      description: 'Dell Technologies',
    },
  });

  const hp = await prisma.brand.create({
    data: {
      tenantId: tenant.id,
      name: 'HP',
      description: 'Hewlett-Packard',
    },
  });

  console.log('✅ Brands created');

  // Create units
  const piece = await prisma.unit.create({
    data: {
      tenantId: tenant.id,
      name: 'Piece',
      symbol: 'pcs',
    },
  });

  const kg = await prisma.unit.create({
    data: {
      tenantId: tenant.id,
      name: 'Kilogram',
      symbol: 'kg',
    },
  });

  console.log('✅ Units created');

  // Create products
  const product1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: 'DELL-LAP-001',
      name: 'Dell Latitude 5520',
      description: '15.6" FHD, Intel i5, 8GB RAM, 256GB SSD',
      categoryId: laptops.id,
      brandId: dell.id,
      unitId: piece.id,
      barcode: '8901234567890',
      costPrice: 45000,
      sellingPrice: 55000,
      mrp: 60000,
      taxRate: 18,
      minStockLevel: 5,
      reorderLevel: 10,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: 'HP-LAP-001',
      name: 'HP ProBook 450 G8',
      description: '15.6" FHD, Intel i7, 16GB RAM, 512GB SSD',
      categoryId: laptops.id,
      brandId: hp.id,
      unitId: piece.id,
      barcode: '8901234567891',
      costPrice: 60000,
      sellingPrice: 72000,
      mrp: 75000,
      taxRate: 18,
      minStockLevel: 3,
      reorderLevel: 8,
    },
  });

  console.log('✅ Products created');

  // Create stock
  await prisma.stock.create({
    data: {
      productId: product1.id,
      warehouseId: mainWarehouse.id,
      quantity: 50,
      available: 50,
    },
  });

  await prisma.stock.create({
    data: {
      productId: product2.id,
      warehouseId: mainWarehouse.id,
      quantity: 30,
      available: 30,
    },
  });

  console.log('✅ Stock created');

  // Create vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      tenantId: tenant.id,
      code: 'VEN-001',
      name: 'Tech Suppliers India',
      email: 'contact@techsuppliers.com',
      phone: '+91 9876543230',
      address: '100 Supplier Street',
      city: 'Delhi',
      state: 'Delhi',
      gstNumber: '07ABCDE1234F1Z5',
      creditLimit: 500000,
      creditDays: 30,
    },
  });

  console.log('✅ Vendors created');

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      code: 'CUST-001',
      name: 'ABC Enterprises',
      email: 'abc@enterprises.com',
      phone: '+91 9876543240',
      address: '200 Customer Road',
      city: 'Bangalore',
      state: 'Karnataka',
      gstNumber: '29ABCDE1234F1Z6',
      creditLimit: 200000,
      creditDays: 15,
    },
  });

  console.log('✅ Customers created');

  // Note: Ledger accounts are created automatically by the accounting module initialization
  // Commenting out manual ledger creation as it requires AccountGroup setup first
  // Run POST /api/v1/accounting/chart-of-accounts/initialize after first login to create default chart of accounts

  console.log('🎉 Database seed completed!');
  console.log('\n📋 Demo Credentials:');
  console.log('Owner: owner@invenzo.com / password123');
  console.log('Manager: manager@invenzo.com / password123');
  console.log('Staff: staff@invenzo.com / password123');
  console.log('\n💡 Tip: Initialize chart of accounts from the accounting module after login');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

