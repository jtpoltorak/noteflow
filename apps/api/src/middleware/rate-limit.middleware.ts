import rateLimit from "express-rate-limit";

// ── Global rate limiter ──────────────────────────────────────
// Generous limit for all API routes — prevents general abuse
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 200,
  standardHeaders: "draft-7", // X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
});

// ── Auth rate limiters ───────────────────────────────────────

// Login: 10 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many login attempts, please try again in 15 minutes",
      code: "LOGIN_RATE_LIMIT",
    },
  },
});

// Register: 5 attempts per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many registration attempts, please try again later",
      code: "REGISTER_RATE_LIMIT",
    },
  },
});

// Change password: 5 attempts per 15 minutes per IP
export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many password change attempts, please try again in 15 minutes",
      code: "PASSWORD_RATE_LIMIT",
    },
  },
});

// Account closure: 3 attempts per hour per IP
export const accountClosureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many account closure attempts, please try again later",
      code: "ACCOUNT_CLOSURE_RATE_LIMIT",
    },
  },
});
