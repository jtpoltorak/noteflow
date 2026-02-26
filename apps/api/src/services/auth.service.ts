import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import type { AuthPayload } from "../middleware/auth.middleware.js";
import type { UserDto } from "@noteflow/shared-types";

const options: SignOptions = {
  expiresIn: process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};
const BCRYPT_ROUNDS = 12;

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

export function generateAccessToken(payload: AuthPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
  return jwt.sign(payload, getJwtSecret(), options);
}

export function generateRefreshToken(payload: AuthPayload): string {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  return jwt.sign(payload, getRefreshSecret(), options);
}

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

  return { id, email, darkMode };
}

export function login(email: string, password: string): UserDto {
  const db = getDb();

  const result = db.exec(
    "SELECT id, email, passwordHash, darkMode FROM User WHERE email = ?",
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

  const valid = bcrypt.compareSync(password, passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return { id, email: userEmail, darkMode };
}

export function getUserById(id: number): UserDto {
  const db = getDb();

  const result = db.exec("SELECT id, email, darkMode FROM User WHERE id = ?", [id]);

  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const row = result[0].values[0];
  return { id: row[0] as number, email: row[1] as string, darkMode: (row[2] as number) === 1 };
}

export function updatePreferences(userId: number, prefs: { darkMode?: boolean }): UserDto {
  const db = getDb();

  if (prefs.darkMode !== undefined) {
    db.run("UPDATE User SET darkMode = ? WHERE id = ?", [prefs.darkMode ? 1 : 0, userId]);
    saveDb();
  }

  return getUserById(userId);
}
