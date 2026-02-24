import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  register,
  login,
  getUserById,
  generateAccessToken,
  generateRefreshToken,
} from "../services/auth.service.js";

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Cookie helpers ────────────────────────────────────────────

function setAuthCookies(res: Response, payload: { id: number; email: string }): void {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
}

// ── Routes ────────────────────────────────────────────────────

router.post("/register", validate(registerSchema), (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof registerSchema>;
  const user = register(email, password);

  setAuthCookies(res, user);
  res.status(201).json({ data: user, message: "Registration successful" });
});

router.post("/login", validate(loginSchema), (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = login(email, password);

  setAuthCookies(res, user);
  res.json({ data: user, message: "Login successful" });
});

router.post("/logout", (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ data: null, message: "Logged out successfully" });
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.id);
  res.json({ data: user });
});

export default router;
