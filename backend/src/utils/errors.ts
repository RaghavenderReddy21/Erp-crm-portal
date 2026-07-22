export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const NotFoundError = (resource: string) =>
  new AppError(`${resource} not found`, 404);

export const ForbiddenError = (message = "You do not have permission to perform this action") =>
  new AppError(message, 403);

export const UnauthorizedError = (message = "Unauthorized") =>
  new AppError(message, 401);

// Wraps async route handlers so thrown errors / rejected promises are
// forwarded to Express's error-handling middleware instead of crashing
// the process or needing a try/catch in every controller.
import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
