import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import type { AuthPayload } from "../middleware/auth.middleware.js";
import type { UserDto, ColorTheme } from "@noteflow/shared-types";

const VALID_THEMES = new Set<ColorTheme>(['default', 'nord', 'solarized', 'dracula', 'catppuccin', 'rose-pine', 'tokyo-night', 'gruvbox', 'everforest', 'one-dark', 'moonlight', 'kanagawa']);

function mapTheme(value: string): ColorTheme {
  return VALID_THEMES.has(value as ColorTheme) ? (value as ColorTheme) : 'default';
}

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, "JWT secret not configured");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new AppError(500, "Refresh token secret not configured");
  return secret;
}

/** Hash a refresh token for secure storage (SHA-256). */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ── Access tokens ────────────────────────────────────────────

export function generateAccessToken(payload: AuthPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions['expiresIn'];
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

// ── Refresh tokens (with rotation) ──────────────────────────

/**
 * Create a new refresh token, store its hash in the DB, and return the raw token.
 * Each token belongs to a "family" — a chain of rotated tokens from one login session.
 */
export function createRefreshToken(payload: AuthPayload, family?: string): string {
  const expiresIn = (process.env.REFRESH_TOKEN_EXPIRES_IN || "7d") as SignOptions['expiresIn'];
  const token = jwt.sign(payload, getRefreshSecret(), { expiresIn });

  const tokenFamily = family || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const db = getDb();
  db.run(
    "INSERT INTO RefreshToken (userId, tokenHash, family, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)",
    [payload.id, hashToken(token), tokenFamily, expiresAt, now]
  );
  saveDb();

  return token;
}

/**
 * Rotate a refresh token: validate the old one, revoke it, and issue a new one
 * in the same family. If the old token was already revoked (reuse detected),
 * revoke the entire family as a security measure.
 */
export function rotateRefreshToken(oldToken: string): { token: string; payload: AuthPayload } {
  // Verify the JWT signature and expiry
  let decoded: AuthPayload;
  try {
    const raw = jwt.verify(oldToken, getRefreshSecret()) as AuthPayload & { iat?: number; exp?: number };
    decoded = { id: raw.id, email: raw.email };
  } catch {
    throw new AppError(401, "Invalid or expired refresh token", "REFRESH_INVALID");
  }

  const db = getDb();
  const oldHash = hashToken(oldToken);

  // Look up the stored token
  const result = db.exec(
    "SELECT id, family, revokedAt FROM RefreshToken WHERE tokenHash = ?",
    [oldHash]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    // Token not in DB — could be from before migration or already cleaned up
    throw new AppError(401, "Refresh token not recognized", "REFRESH_INVALID");
  }

  const row = result[0].values[0];
  const tokenId = row[0] as number;
  const family = row[1] as string;
  const revokedAt = row[2] as string | null;

  // Reuse detection: if this token was already revoked, someone may have stolen it.
  // Revoke the entire family to protect the user.
  if (revokedAt) {
    db.run(
      "UPDATE RefreshToken SET revokedAt = ? WHERE family = ? AND revokedAt IS NULL",
      [new Date().toISOString(), family]
    );
    saveDb();
    throw new AppError(401, "Refresh token reuse detected — all sessions revoked", "REFRESH_REUSE");
  }

  // Revoke the old token
  const now = new Date().toISOString();
  db.run("UPDATE RefreshToken SET revokedAt = ? WHERE id = ?", [now, tokenId]);
  saveDb();

  // Issue a new token in the same family
  const newToken = createRefreshToken(decoded, family);
  return { token: newToken, payload: decoded };
}

/**
 * Revoke all refresh tokens for a user (logout everywhere, password change).
 */
export function revokeAllUserTokens(userId: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.run(
    "UPDATE RefreshToken SET revokedAt = ? WHERE userId = ? AND revokedAt IS NULL",
    [now, userId]
  );
  saveDb();
}

/**
 * Revoke a single refresh token (normal logout).
 */
export function revokeSingleToken(token: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.run(
    "UPDATE RefreshToken SET revokedAt = ? WHERE tokenHash = ? AND revokedAt IS NULL",
    [now, hashToken(token)]
  );
  saveDb();
}

/**
 * Clean up expired refresh tokens older than 30 days.
 */
export function cleanupExpiredTokens(): void {
  const db = getDb();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.run("DELETE FROM RefreshToken WHERE expiresAt < ?", [cutoff]);
  saveDb();
}

// ── Legacy verify (kept for auth middleware compatibility) ────

export function verifyRefreshToken(token: string): AuthPayload {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as AuthPayload & { iat?: number; exp?: number };
    return { id: decoded.id, email: decoded.email };
  } catch {
    throw new AppError(401, "Invalid or expired refresh token", "REFRESH_INVALID");
  }
}

// ── User CRUD ────────────────────────────────────────────────

export function register(email: string, password: string): UserDto {
  const db = getDb();

  // Check if user already exists
  const existing = db.exec("SELECT id FROM User WHERE email = ?", [email]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    throw new AppError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const now = new Date().toISOString();

  db.run("INSERT INTO User (email, passwordHash, createdAt) VALUES (?, ?, ?)", [
    email,
    passwordHash,
    now,
  ]);
  saveDb();

  const result = db.exec("SELECT id, darkMode FROM User WHERE email = ?", [email]);
  const id = result[0].values[0][0] as number;
  const darkMode = (result[0].values[0][1] as number) === 1;

  return { id, email, darkMode, skipRecycleBin: false, colorTheme: 'default', deleteRequestedAt: null };
}

export function login(email: string, password: string): UserDto {
  const db = getDb();

  const result = db.exec(
    "SELECT id, email, passwordHash, darkMode, deleteRequestedAt, skipRecycleBin, accentTheme FROM User WHERE email = ?",
    [email]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const row = result[0].values[0];
  const id = row[0] as number;
  const userEmail = row[1] as string;
  const passwordHash = row[2] as string;
  const darkMode = (row[3] as number) === 1;
  const deleteRequestedAt = (row[4] as string | null) ?? null;
  const skipRecycleBin = (row[5] as number) === 1;
  const colorTheme = mapTheme((row[6] as string) || 'default');

  const valid = bcrypt.compareSync(password, passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return { id, email: userEmail, darkMode, skipRecycleBin, colorTheme, deleteRequestedAt };
}

export function getUserById(id: number): UserDto {
  const db = getDb();

  const result = db.exec("SELECT id, email, darkMode, deleteRequestedAt, skipRecycleBin, accentTheme FROM User WHERE id = ?", [id]);

  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const row = result[0].values[0];
  return {
    id: row[0] as number,
    email: row[1] as string,
    darkMode: (row[2] as number) === 1,
    skipRecycleBin: (row[4] as number) === 1,
    colorTheme: mapTheme((row[5] as string) || 'default'),
    deleteRequestedAt: (row[3] as string | null) ?? null,
  };
}

export function updatePreferences(userId: number, prefs: { darkMode?: boolean; skipRecycleBin?: boolean; colorTheme?: string }): UserDto {
  const db = getDb();

  if (prefs.darkMode !== undefined) {
    db.run("UPDATE User SET darkMode = ? WHERE id = ?", [prefs.darkMode ? 1 : 0, userId]);
  }
  if (prefs.skipRecycleBin !== undefined) {
    db.run("UPDATE User SET skipRecycleBin = ? WHERE id = ?", [prefs.skipRecycleBin ? 1 : 0, userId]);
  }
  if (prefs.colorTheme !== undefined) {
    db.run("UPDATE User SET accentTheme = ? WHERE id = ?", [prefs.colorTheme, userId]);
  }

  saveDb();
  return getUserById(userId);
}

export function changePassword(userId: number, currentPassword: string, newPassword: string): void {
  const db = getDb();

  const result = db.exec("SELECT passwordHash FROM User WHERE id = ?", [userId]);
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const passwordHash = result[0].values[0][0] as string;
  const valid = bcrypt.compareSync(currentPassword, passwordHash);
  if (!valid) {
    throw new AppError(401, "Current password is incorrect", "INVALID_PASSWORD");
  }

  const newHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  db.run("UPDATE User SET passwordHash = ? WHERE id = ?", [newHash, userId]);
  saveDb();

  // Revoke all refresh tokens — forces re-login on all devices
  revokeAllUserTokens(userId);
}
