import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("Password123!", 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@erp.test" },
      update: {},
      create: { name: "Admin User", email: "admin@erp.test", passwordHash: password, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@erp.test" },
      update: {},
      create: { name: "Sales User", email: "sales@erp.test", passwordHash: password, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@erp.test" },
      update: {},
      create: {
        name: "Warehouse User",
        email: "warehouse@erp.test",
        passwordHash: password,
        role: "WAREHOUSE",
      },
    }),
    prisma.user.upsert({
      where: { email: "accounts@erp.test" },
      update: {},
      create: {
        name: "Accounts User",
        email: "accounts@erp.test",
        passwordHash: password,
        role: "ACCOUNTS",
      },
    }),
  ]);

  const customer = await prisma.customer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ramesh Traders",
      mobile: "9876543210",
      email: "ramesh@traders.test",
      businessName: "Ramesh Traders Pvt Ltd",
      customerType: "WHOLESALE",
      status: "ACTIVE",
      address: "12 MG Road, Hyderabad",
      createdById: sales.id,
    },
  });

  const product1 = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      name: "Steel Bolt 10mm",
      sku: "SKU-001",
      category: "Hardware",
      unitPrice: 5.5,
      currentStock: 500,
      minStockAlert: 50,
      location: "Warehouse A - Rack 3",
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: {
      name: "Copper Wire 2mm (per meter)",
      sku: "SKU-002",
      category: "Electrical",
      unitPrice: 22.0,
      currentStock: 20,
      minStockAlert: 30, // intentionally below alert threshold to demo low-stock
      location: "Warehouse A - Rack 7",
    },
  });

  console.log("Seed complete.");
  console.log("Test logins (all use password: Password123!):");
  console.log(`  Admin:      admin@erp.test`);
  console.log(`  Sales:      sales@erp.test`);
  console.log(`  Warehouse:  warehouse@erp.test`);
  console.log(`  Accounts:   accounts@erp.test`);
  console.log(`Sample customer: ${customer.name} (${customer.id})`);
  console.log(`Sample products: ${product1.sku}, ${product2.sku}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
