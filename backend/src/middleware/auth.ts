import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

export interface AuthPayload {
  userId: string;
  role: Role;
  email: string;
}

// Augment Express's Request type so req.user is typed everywhere.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(UnauthorizedError("Missing or malformed Authorization header"));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(UnauthorizedError("Invalid or expired token"));
  }
}

// Usage: requireRole("ADMIN", "SALES")
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(
        ForbiddenError(`This action requires one of these roles: ${roles.join(", ")}`)
      );
    }
    next();
  };
}
