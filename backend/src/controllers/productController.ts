import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
  paginationSchema,
} from "../validators/schemas";
import { AppError, NotFoundError } from "../utils/errors";

export async function createProduct(req: Request, res: Response) {
  const data = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data: {
      ...data,
      currentStock: data.currentStock ?? 0,
      minStockAlert: data.minStockAlert ?? 0,
    },
  });

  res.status(201).json(product);
}

export async function listProducts(req: Request, res: Response) {
  const { page, limit, search } = paginationSchema.parse(req.query);
  const lowStockOnly = req.query.lowStock === "true";

  const where: any = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [total, allMatching] = await Promise.all([
    prisma.product.count({ where }),
    lowStockOnly
      ? prisma.product.findMany({ where }) // filtered in memory below because
        // Prisma can't compare two columns (currentStock <= minStockAlert)
        // directly in a `where` filter without a raw query.
      : Promise.resolve(null),
  ]);

  let data;
  let total_;
  if (lowStockOnly) {
    const filtered = (allMatching || []).filter((p) => p.currentStock <= p.minStockAlert);
    total_ = filtered.length;
    data = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);
  } else {
    total_ = total;
    data = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  res.json({
    data,
    pagination: { page, limit, total: total_, totalPages: Math.ceil(total_ / limit) },
  });
}

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { stockMovements: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!product) throw NotFoundError("Product");
  res.json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const data = updateProductSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw NotFoundError("Product");

  // Direct stock edits should go through the stock-movement endpoint so
  // there's always an audit trail. Block silent overwrites here.
  const { currentStock, ...rest } = data as any;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: rest,
  });

  res.json(product);
}

// Records a stock movement (IN or OUT) and atomically updates currentStock.
export async function addStockMovement(req: Request, res: Response) {
  const data = stockMovementSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw NotFoundError("Product");

    const delta = data.movementType === "IN" ? data.quantity : -data.quantity;
    const newStock = product.currentStock + delta;

    if (newStock < 0) {
      throw new AppError(
        `Insufficient stock. Current stock is ${product.currentStock}, cannot remove ${data.quantity}.`,
        409
      );
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId: req.params.id,
        quantity: data.quantity,
        movementType: data.movementType,
        reason: data.reason,
        createdById: req.user!.userId,
      },
    });

    const updatedProduct = await tx.product.update({
      where: { id: req.params.id },
      data: { currentStock: newStock },
    });

    return { movement, product: updatedProduct };
  });

  res.status(201).json(result);
}
