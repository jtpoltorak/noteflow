import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  loginLimiter,
  registerLimiter,
  changePasswordLimiter,
  accountClosureLimiter,
} from "../middleware/rate-limit.middleware.js";
import {
  register,
  login,
  getUserById,
  updatePreferences,
  changePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../services/auth.service.js";
import { exportAsJson, exportAsMarkdownZip } from "../services/export.service.js";
import { requestAccountClosure, reactivateAccount } from "../services/account-closure.service.js";

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
  skipRecycleBin: z.boolean().optional(),
  colorTheme: z.enum(['default', 'nord', 'solarized', 'dracula', 'catppuccin', 'rose-pine', 'tokyo-night', 'gruvbox', 'everforest', 'one-dark', 'moonlight', 'kanagawa']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const closeAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
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

router.post("/register", registerLimiter, validate(registerSchema), (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof registerSchema>;
  const user = register(email, password);

  setAuthCookies(res, user);
  res.status(201).json({ data: user, message: "Registration successful" });
});

router.post("/login", loginLimiter, validate(loginSchema), (req: Request, res: Response) => {
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

router.put("/password", requireAuth, changePasswordLimiter, validate(changePasswordSchema), (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
  changePassword(req.user!.id, currentPassword, newPassword);
  res.json({ data: null, message: "Password changed successfully" });
});

router.get("/export/json", requireAuth, (req: Request, res: Response) => {
  const json = exportAsJson(req.user!.id, req.user!.email);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=noteflow-export.json");
  res.send(json);
});

router.get("/export/markdown", requireAuth, (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=noteflow-export.zip");
  exportAsMarkdownZip(req.user!.id, req.user!.email, res);
});

// ── Account closure ──────────────────────────────────────────

router.post("/close-account", requireAuth, accountClosureLimiter, validate(closeAccountSchema), (req: Request, res: Response) => {
  const { password } = req.body as z.infer<typeof closeAccountSchema>;
  const status = requestAccountClosure(req.user!.id, password);
  res.json({ data: status, message: "Account scheduled for deletion" });
});

router.post("/reactivate-account", requireAuth, (req: Request, res: Response) => {
  reactivateAccount(req.user!.id);
  res.json({ data: null, message: "Account reactivated successfully" });
});

export default router;
