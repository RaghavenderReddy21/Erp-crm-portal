import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import {
  createCustomerSchema,
  updateCustomerSchema,
  followUpSchema,
  paginationSchema,
} from "../validators/schemas";
import { NotFoundError } from "../utils/errors";

export async function createCustomer(req: Request, res: Response) {
  const data = createCustomerSchema.parse(req.body);

  const customer = await prisma.customer.create({
    data: {
      ...data,
      email: data.email || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      createdById: req.user!.userId,
    },
  });

  res.status(201).json(customer);
}

export async function listCustomers(req: Request, res: Response) {
  const { page, limit, search } = paginationSchema.parse(req.query);
  const status = req.query.status as string | undefined;
  const customerType = req.query.customerType as string | undefined;

  const where: any = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { mobile: { contains: search } },
              { businessName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      customerType ? { customerType } : {},
    ],
  };

  const [total, data] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      followUps: { orderBy: { createdAt: "desc" } },
      challans: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) throw NotFoundError("Customer");
  res.json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const data = updateCustomerSchema.parse(req.body);

  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw NotFoundError("Customer");

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...data,
      email: data.email !== undefined ? data.email || null : undefined,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
  });

  res.json(customer);
}

export async function addFollowUp(req: Request, res: Response) {
  const data = followUpSchema.parse(req.body);

  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) throw NotFoundError("Customer");

  const followUp = await prisma.followUp.create({
    data: {
      customerId: req.params.id,
      note: data.note,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      createdById: req.user!.userId,
    },
  });

  // Keep the customer's headline follow-up date in sync with the latest note.
  if (data.followUpDate) {
    await prisma.customer.update({
      where: { id: req.params.id },
      data: { followUpDate: new Date(data.followUpDate) },
    });
  }

  res.status(201).json(followUp);
}
