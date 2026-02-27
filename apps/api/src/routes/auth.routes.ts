import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  register,
  login,
  getUserById,
  updatePreferences,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
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

const preferencesSchema = z.object({
  darkMode: z.boolean().optional(),
});

// ── Cookie helpers ────────────────────────────────────────────

function setAuthCookies(res: Response, payload: { id: number; email: string }): void {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", { secure: true, sameSite: "none" });
  res.clearCookie("refreshToken", { secure: true, sameSite: "none" });
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

router.post("/refresh", (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    clearAuthCookies(res);
    res.status(401).json({ error: { message: "No refresh token", code: "REFRESH_MISSING" } });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    setAuthCookies(res, payload);
    res.json({ data: null, message: "Tokens refreshed" });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ error: { message: "Invalid or expired refresh token", code: "REFRESH_INVALID" } });
  }
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  const user = getUserById(req.user!.id);
  res.json({ data: user });
});

router.put("/preferences", requireAuth, validate(preferencesSchema), (req: Request, res: Response) => {
  const prefs = req.body as z.infer<typeof preferencesSchema>;
  const user = updatePreferences(req.user!.id, prefs);
  res.json({ data: user });
});

export default router;
