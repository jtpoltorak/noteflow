import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";

export interface AuthPayload {
  id: number;
  email: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;

  if (!token) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, "JWT secret not configured");
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token", "UNAUTHORIZED");
  }
}

/**
 * Populate req.user if a valid access token is present, but do NOT reject
 * anonymous requests. Used by endpoints that serve both authenticated owners
 * and unauthenticated viewers (e.g. media referenced by publicly shared notes).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;
  const secret = process.env.JWT_SECRET;

  if (token && secret) {
    try {
      req.user = jwt.verify(token, secret) as AuthPayload;
    } catch {
      // Invalid/expired token — treat as anonymous, don't throw.
    }
  }

  next();
}
