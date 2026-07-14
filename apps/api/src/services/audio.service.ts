import path from "path";
import fs from "fs";
import crypto from "node:crypto";
import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { validateAudioMagicBytes, sanitizeOriginalName } from "../utils/file-validation.js";
import { canAccessNoteMedia } from "./note.service.js";
import type { AudioDto } from "@noteflow/shared-types";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./data/uploads";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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

export function uploadAudio(
  noteId: number,
  userId: number,
  file: { originalname: string; mimetype: string; buffer: Buffer; size: number }
): AudioDto {
  verifyNoteOwnership(noteId, userId);

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, "File too large. Maximum size is 25 MB", "FILE_TOO_LARGE");
  }

  // Validate by magic bytes — not the client-reported MIME type
  let verified: { mime: string; ext: string };
  try {
    verified = validateAudioMagicBytes(file.buffer);
  } catch {
    throw new AppError(400, "Invalid file type. Allowed: mp3, wav, ogg, webm, mp4 audio", "INVALID_FILE_TYPE");
  }

  // Use verified extension, never the user-supplied one
  const filename = `${crypto.randomUUID()}${verified.ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const safeName = sanitizeOriginalName(file.originalname);

  fs.writeFileSync(filePath, file.buffer);

  const db = getDb();
  const now = new Date().toISOString();
  db.run(
    "INSERT INTO Audio (noteId, filename, originalName, mimeType, size, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [noteId, filename, safeName, verified.mime, file.size, now]
  );
  saveDb();

  const result = db.exec("SELECT last_insert_rowid()");
  const id = result[0].values[0][0] as number;

  return {
    id,
    noteId,
    filename,
    originalName: safeName,
    mimeType: verified.mime,
    size: file.size,
    url: `/api/v1/audio/${filename}`,
    createdAt: now,
  };
}

/**
 * Resolve the absolute path of an audio file the caller is authorized to read.
 * Throws 404 if no such audio, 403 if the caller may not access its note.
 * `userId` is undefined for anonymous (shared-note) requests.
 */
export function resolveAudioPath(filename: string, userId?: number): string {
  const db = getDb();
  const result = db.exec("SELECT noteId FROM Audio WHERE filename = ?", [filename]);

  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Audio not found", "NOT_FOUND");
  }

  const noteId = result[0].values[0][0] as number;
  if (!canAccessNoteMedia(noteId, userId)) {
    throw new AppError(403, "Not authorized to access this file", "FORBIDDEN");
  }

  return path.resolve(UPLOAD_DIR, filename);
}
