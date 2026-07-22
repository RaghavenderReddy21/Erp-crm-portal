import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance (avoids exhausting DB connections in dev
// with hot-reload, and is the standard pattern for a small service).
export const prisma = new PrismaClient();
