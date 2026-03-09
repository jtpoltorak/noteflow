import path from "path";
import fs from "fs";
import crypto from "node:crypto";
import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import type { ImageDto } from "@noteflow/shared-types";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/** Ensure the uploads directory exists. Call once at startup. */
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/** Verify the user owns the note. */
function verifyNoteOwnership(noteId: number, userId: number): void {
  const db = getDb();
  const result = db.exec(
    `SELECT n.id FROM Note n
     JOIN Section s ON n.sectionId = s.id
     JOIN Notebook nb ON s.notebookId = nb.id
     WHERE n.id = ? AND nb.userId = ?`,
    [noteId, userId]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Note not found", "NOT_FOUND");
  }
}

export function uploadImage(
  noteId: number,
  userId: number,
  file: { originalname: string; mimetype: string; buffer: Buffer; size: number }
): ImageDto {
  verifyNoteOwnership(noteId, userId);

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError(400, "Invalid file type. Allowed: png, jpeg, gif, webp", "INVALID_FILE_TYPE");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, "File too large. Maximum size is 5 MB", "FILE_TOO_LARGE");
  }

  const ext = path.extname(file.originalname) || mimeToExt(file.mimetype);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  fs.writeFileSync(filePath, file.buffer);

  const db = getDb();
  const now = new Date().toISOString();
  db.run(
    "INSERT INTO Image (noteId, filename, originalName, mimeType, size, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [noteId, filename, file.originalname, file.mimetype, file.size, now]
  );
  saveDb();

  const result = db.exec("SELECT last_insert_rowid()");
  const id = result[0].values[0][0] as number;

  return {
    id,
    noteId,
    filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `/api/v1/images/${filename}`,
    createdAt: now,
  };
}

export function getUploadDir(): string {
  return UPLOAD_DIR;
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/png": return ".png";
    case "image/jpeg": return ".jpg";
    case "image/gif": return ".gif";
    case "image/webp": return ".webp";
    default: return ".bin";
  }
}
