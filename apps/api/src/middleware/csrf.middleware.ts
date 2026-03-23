import { randomBytes } from "node:crypto";
import { Request, Response, NextFunction } from "express";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "x-xsrf-token";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Routes that don't require CSRF validation (unauthenticated or safe).
// Paths are relative to the mount point (/api/v1), so use req.path which
// strips the mount prefix.
const CSRF_SKIP_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
  "/shared/",
  "/health",
];

function shouldSkipCsrf(req: Request): boolean {
  return CSRF_SKIP_PATHS.some((path) => req.path.startsWith(path));
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Double-submit cookie CSRF protection.
 *
 * On every response: sets a JS-readable XSRF-TOKEN cookie.
 * On mutating requests: validates that the X-XSRF-TOKEN header matches the cookie.
 *
 * Works with Angular's built-in XSRF support (withXsrfConfiguration).
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Always set/refresh the CSRF token cookie so the client has a valid token
  const existingToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const token = existingToken || generateToken();

  if (!existingToken) {
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
  }

  // Only validate on mutating requests
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  // Skip validation for unauthenticated/safe routes
  if (shouldSkipCsrf(req)) {
    next();
    return;
  }

  // Validate: header must match cookie
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!headerToken || headerToken !== token) {
    res.status(403).json({
      error: {
        message: "Invalid or missing CSRF token",
        code: "CSRF_INVALID",
      },
    });
    return;
  }

  next();
}
