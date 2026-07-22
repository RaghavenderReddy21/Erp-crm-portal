import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors";

// Centralized error handler. Every route uses asyncHandler so errors land
// here instead of being handled ad-hoc in each controller.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Validation errors from zod
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Known Prisma errors (unique constraint, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: `A record with this ${(err.meta?.target as string[])?.join(", ")} already exists`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.status(400).json({ error: "Database error", code: err.code });
  }

  // Our own thrown application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Anything unexpected
  console.error("Unexpected error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
