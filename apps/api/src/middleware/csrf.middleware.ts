import { randomBytes } from "node:crypto";
import { Request, Response, NextFunction } from "express";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "x-xsrf-token";
const CSRF_RESPONSE_HEADER = "X-XSRF-TOKEN";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Exact paths that skip CSRF (unauthenticated routes only)
const CSRF_SKIP_EXACT = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
  "/health",
]);

// Prefix paths that skip CSRF
const CSRF_SKIP_PREFIXES = [
  "/shared/",
];

function shouldSkipCsrf(req: Request): boolean {
  return CSRF_SKIP_EXACT.has(req.path) ||
    CSRF_SKIP_PREFIXES.some((prefix) => req.path.startsWith(prefix));
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Double-submit cookie CSRF protection.
 *
 * On every response: sets a JS-readable XSRF-TOKEN cookie AND exposes the
 * token in an X-XSRF-TOKEN response header. The response header is needed
 * for cross-origin setups where JavaScript cannot read cookies from a
 * different domain.
 *
 * On mutating requests: validates that the X-XSRF-TOKEN request header
 * matches the cookie value.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Always set/refresh the CSRF token cookie so the client has a valid token
  const existingToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const token = existingToken || generateToken();

  if (!existingToken) {
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // Must be readable by JavaScript (same-origin)
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
  }

  // Always expose the token in a response header so cross-origin clients
  // can read it (the cookie is unreadable cross-origin via document.cookie)
  res.setHeader(CSRF_RESPONSE_HEADER, token);

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
