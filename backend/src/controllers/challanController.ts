import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import {
  createChallanSchema,
  updateChallanStatusSchema,
  paginationSchema,
} from "../validators/schemas";
import { AppError, NotFoundError } from "../utils/errors";

// Generates a sequential, human-readable challan number like CH-2026-0001.
// Uses a transaction-safe count of existing challans this year.
async function generateChallanNumber(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.challan.count({
    where: { challanNumber: { startsWith: `CH-${year}-` } },
  });
  const next = String(count + 1).padStart(4, "0");
  return `CH-${year}-${next}`;
}

export async function createChallan(req: Request, res: Response) {
  const data = createChallanSchema.parse(req.body);
  const desiredStatus = data.status ?? "DRAFT";

 const challan = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw NotFoundError("Customer");

    // Fetch all products referenced, validate they exist, and build
    // snapshot data + the item rows in one pass.
    const productIds = data.items.map((i) => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of data.items) {
      if (!productMap.has(item.productId)) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }
    }

    // If confirming immediately, validate stock BEFORE writing anything.
    if (desiredStatus === "CONFIRMED") {
      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        if (product.currentStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.name}" (SKU ${product.sku}). ` +
              `Available: ${product.currentStock}, requested: ${item.quantity}.`,
            409
          );
        }
      }
    }

    const challanNumber = await generateChallanNumber(tx);
    const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

    const created = await tx.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        totalQuantity,
        status: desiredStatus,
        createdById: req.user!.userId,
        items: {
          create: data.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
            };
          }),
        },
      },
      include: { items: true, customer: true },
    });

    // If confirmed at creation time, deduct stock and log movements now.
    if (desiredStatus === "CONFIRMED") {
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Sales challan ${challanNumber}`,
            createdById: req.user!.userId,
          },
        });
      }
    }

    return created;
  },{ timeout: 15000});

  res.status(201).json(challan);
}

export async function listChallans(req: Request, res: Response) {
  const { page, limit } = paginationSchema.parse(req.query);
  const status = req.query.status as string | undefined;
  const customerId = req.query.customerId as string | undefined;

  const where: any = {
    AND: [status ? { status } : {}, customerId ? { customerId } : {}],
  };

  const [total, data] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    }),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getChallan(req: Request, res: Response) {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, items: { include: { product: true } }, createdBy: true },
  });
  if (!challan) throw NotFoundError("Challan");
  res.json(challan);
}

// Transitions a challan's status. This is where the core business rule
// lives: confirming a Draft challan reduces stock (never below zero);
// cancelling a previously-Confirmed challan restores stock.
export async function updateChallanStatus(req: Request, res: Response) {
  const { status: newStatus } = updateChallanStatusSchema.parse(req.body);

  const updated = await prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!challan) throw NotFoundError("Challan");

    if (challan.status === newStatus) {
      return challan; // no-op
    }

    if (challan.status === "CANCELLED") {
      throw new AppError("A cancelled challan cannot change status", 409);
    }

    // DRAFT -> CONFIRMED: deduct stock, validating availability first.
    if (challan.status === "DRAFT" && newStatus === "CONFIRMED") {
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw NotFoundError("Product");
        if (product.currentStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${item.productNameSnapshot}". ` +
              `Available: ${product.currentStock}, requested: ${item.quantity}.`,
            409
          );
        }
      }
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Sales challan ${challan.challanNumber} confirmed`,
            createdById: req.user!.userId,
          },
        });
      }
    }

    // CONFIRMED -> CANCELLED: restore stock that was previously deducted.
    if (challan.status === "CONFIRMED" && newStatus === "CANCELLED") {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "IN",
            reason: `Sales challan ${challan.challanNumber} cancelled - stock restored`,
            createdById: req.user!.userId,
          },
        });
      }
    }

    // DRAFT -> CANCELLED: no stock was ever deducted, just close it out.

    return tx.challan.update({
      where: { id: req.params.id },
      data: { status: newStatus },
      include: { items: true, customer: true },
    });
  },{ timeout:15000});

  res.json(updated);
}
