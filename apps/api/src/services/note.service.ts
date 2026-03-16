import bcrypt from "bcryptjs";
import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getSectionById } from "./section.service.js";
import crypto from "node:crypto";
import type { NoteDto, ArchivedNoteDto, FavoriteNoteDto, SharedNoteDto, SharedNoteListDto, NoteLinkContextDto } from "@noteflow/shared-types";

const BCRYPT_ROUNDS = 12;

function rowToNote(row: unknown[], hideContentIfLocked = false): NoteDto {
  const passwordHash = row[8] as string | null;
  const isLocked = !!passwordHash;
  return {
    id: row[0] as number,
    sectionId: row[1] as number,
    title: row[2] as string,
    content: (hideContentIfLocked && isLocked) ? '' : row[3] as string,
    order: row[4] as number,
    archivedAt: (row[5] as string | null) ?? null,
    favoritedAt: (row[6] as string | null) ?? null,
    shareToken: (row[7] as string | null) ?? null,
    isLocked,
    createdAt: row[9] as string,
    updatedAt: row[10] as string,
  };
}

export function getNotesBySection(sectionId: number, userId: number): NoteDto[] {
  getSectionById(sectionId, userId); // verifies ownership

  const db = getDb();
  const result = db.exec(
    'SELECT id, sectionId, title, content, "order", archivedAt, favoritedAt, shareToken, passwordHash, createdAt, updatedAt FROM Note WHERE sectionId = ? AND archivedAt IS NULL AND deletedAt IS NULL ORDER BY "order" ASC, id ASC',
    [sectionId]
  );
  if (result.length === 0) return [];
  return result[0].values.map((row) => rowToNote(row, true));
}

/** Internal helper — returns note with full content regardless of lock status. */
function getNoteRaw(id: number, userId: number): NoteDto {
  const db = getDb();
  const result = db.exec(
    'SELECT id, sectionId, title, content, "order", archivedAt, favoritedAt, shareToken, passwordHash, createdAt, updatedAt FROM Note WHERE id = ? AND deletedAt IS NULL',
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Note not found", "NOT_FOUND");
  }
  const note = rowToNote(result[0].values[0], false);

  // Verify ownership through section → notebook → user
  getSectionById(note.sectionId, userId);

  return note;
}

export function getNoteById(id: number, userId: number): NoteDto {
  const note = getNoteRaw(id, userId);
  if (note.isLocked) {
    return { ...note, content: '' };
  }
  return note;
}

export function createNote(
  sectionId: number,
  userId: number,
  title: string,
  content: string
): NoteDto {
  getSectionById(sectionId, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();

  const maxResult = db.exec(
    'SELECT COALESCE(MAX("order"), -1) FROM Note WHERE sectionId = ?',
    [sectionId]
  );
  const nextOrder = (maxResult[0].values[0][0] as number) + 1;

  db.run(
    'INSERT INTO Note (sectionId, title, content, "order", createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [sectionId, title, content, nextOrder, now, now]
  );

  const idResult = db.exec("SELECT last_insert_rowid() as id");
  const id = idResult[0].values[0][0] as number;
  saveDb();

  return { id, sectionId, title, content, order: nextOrder, archivedAt: null, favoritedAt: null, shareToken: null, isLocked: false, createdAt: now, updatedAt: now };
}

export function updateNote(
  id: number,
  userId: number,
  updates: { title?: string; content?: string; order?: number; sectionId?: number }
): NoteDto {
  const existing = getNoteRaw(id, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();
  const title = updates.title ?? existing.title;
  const content = updates.content ?? existing.content;
  let order = updates.order ?? existing.order;
  let sectionId = existing.sectionId;

  // Moving to a different section
  if (updates.sectionId && updates.sectionId !== existing.sectionId) {
    getSectionById(updates.sectionId, userId); // verify ownership of target section
    sectionId = updates.sectionId;
    const maxResult = db.exec(
      'SELECT COALESCE(MAX("order"), -1) FROM Note WHERE sectionId = ?',
      [sectionId]
    );
    order = (maxResult[0].values[0][0] as number) + 1;
  }

  db.run(
    'UPDATE Note SET sectionId = ?, title = ?, content = ?, "order" = ?, updatedAt = ? WHERE id = ?',
    [sectionId, title, content, order, now, id]
  );
  saveDb();

  return { ...existing, sectionId, title, content, order, updatedAt: now };
}

export function deleteNote(id: number, userId: number): void {
  getNoteRaw(id, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET deletedAt = ? WHERE id = ?", [now, id]);
  saveDb();
}

export function archiveNote(id: number, userId: number): void {
  const note = getNoteRaw(id, userId);
  if (note.archivedAt) {
    throw new AppError(400, "Note is already archived", "ALREADY_ARCHIVED");
  }

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET archivedAt = ?, updatedAt = ? WHERE id = ?", [now, now, id]);
  saveDb();
}

export function unarchiveNote(id: number, userId: number, targetSectionId: number): void {
  const note = getNoteRaw(id, userId);
  if (!note.archivedAt) {
    throw new AppError(400, "Note is not archived", "NOT_ARCHIVED");
  }

  // Verify ownership of target section
  getSectionById(targetSectionId, userId);

  const db = getDb();
  const now = new Date().toISOString();

  // Place at end of target section
  const maxResult = db.exec(
    'SELECT COALESCE(MAX("order"), -1) FROM Note WHERE sectionId = ? AND archivedAt IS NULL',
    [targetSectionId]
  );
  const nextOrder = (maxResult[0].values[0][0] as number) + 1;

  db.run(
    'UPDATE Note SET sectionId = ?, "order" = ?, archivedAt = NULL, updatedAt = ? WHERE id = ?',
    [targetSectionId, nextOrder, now, id]
  );
  saveDb();
}

export function favoriteNote(id: number, userId: number): void {
  const note = getNoteRaw(id, userId);
  if (note.favoritedAt) {
    throw new AppError(400, "Note is already favorited", "ALREADY_FAVORITED");
  }

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET favoritedAt = ?, updatedAt = ? WHERE id = ?", [now, now, id]);
  saveDb();
}

export function unfavoriteNote(id: number, userId: number): void {
  const note = getNoteRaw(id, userId);
  if (!note.favoritedAt) {
    throw new AppError(400, "Note is not favorited", "NOT_FAVORITED");
  }

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET favoritedAt = NULL, updatedAt = ? WHERE id = ?", [now, id]);
  saveDb();
}

export function getFavoriteNotes(userId: number): FavoriteNoteDto[] {
  const db = getDb();
  const result = db.exec(
    `SELECT n.id, n.title, n.sectionId, s.title AS sectionTitle,
            s.notebookId, nb.title AS notebookTitle, n.favoritedAt, n.updatedAt
     FROM Note n
     JOIN Section s ON s.id = n.sectionId
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nb.userId = ? AND n.favoritedAt IS NOT NULL AND n.archivedAt IS NULL AND n.deletedAt IS NULL
     ORDER BY n.favoritedAt DESC`,
    [userId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    title: row[1] as string,
    sectionId: row[2] as number,
    sectionTitle: row[3] as string,
    notebookId: row[4] as number,
    notebookTitle: row[5] as string,
    favoritedAt: row[6] as string,
    updatedAt: row[7] as string,
  }));
}

export function getArchivedNotes(userId: number): ArchivedNoteDto[] {
  const db = getDb();
  const result = db.exec(
    `SELECT n.id, n.title, n.sectionId, s.title AS sectionTitle,
            s.notebookId, nb.title AS notebookTitle, n.archivedAt, n.updatedAt
     FROM Note n
     JOIN Section s ON s.id = n.sectionId
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nb.userId = ? AND n.archivedAt IS NOT NULL AND n.deletedAt IS NULL
     ORDER BY n.archivedAt DESC`,
    [userId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    title: row[1] as string,
    sectionId: row[2] as number,
    sectionTitle: row[3] as string,
    notebookId: row[4] as number,
    notebookTitle: row[5] as string,
    archivedAt: row[6] as string,
    updatedAt: row[7] as string,
  }));
}

export function shareNote(id: number, userId: number): string {
  getNoteRaw(id, userId); // verifies ownership

  const token = crypto.randomBytes(16).toString("base64url");
  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET shareToken = ?, updatedAt = ? WHERE id = ?", [token, now, id]);
  saveDb();

  return token;
}

export function unshareNote(id: number, userId: number): void {
  getNoteRaw(id, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET shareToken = NULL, updatedAt = ? WHERE id = ?", [now, id]);
  saveDb();
}

export function getNoteByShareToken(token: string): SharedNoteDto {
  const db = getDb();
  const result = db.exec(
    "SELECT title, content, updatedAt, archivedAt FROM Note WHERE shareToken = ? AND deletedAt IS NULL",
    [token]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Shared note not found", "NOT_FOUND");
  }

  const row = result[0].values[0];
  const archivedAt = row[3] as string | null;

  if (archivedAt) {
    throw new AppError(404, "Shared note not found", "NOT_FOUND");
  }

  return {
    title: row[0] as string,
    content: row[1] as string,
    updatedAt: row[2] as string,
  };
}

export function getSharedNotes(userId: number): SharedNoteListDto[] {
  const db = getDb();
  const result = db.exec(
    `SELECT n.id, n.title, n.shareToken, n.sectionId, s.title AS sectionTitle,
            s.notebookId, nb.title AS notebookTitle, n.updatedAt
     FROM Note n
     JOIN Section s ON s.id = n.sectionId
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nb.userId = ? AND n.shareToken IS NOT NULL AND n.archivedAt IS NULL AND n.deletedAt IS NULL
     ORDER BY n.updatedAt DESC`,
    [userId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    title: row[1] as string,
    shareToken: row[2] as string,
    sectionId: row[3] as number,
    sectionTitle: row[4] as string,
    notebookId: row[5] as number,
    notebookTitle: row[6] as string,
    updatedAt: row[7] as string,
  }));
}

// ── Note link context ───────────────────────────────────────────

export function getNoteLinkContext(id: number, userId: number): NoteLinkContextDto {
  const note = getNoteRaw(id, userId);
  const section = getSectionById(note.sectionId, userId);
  return {
    noteId: note.id,
    noteTitle: note.title,
    sectionId: note.sectionId,
    notebookId: section.notebookId,
  };
}

// ── Password protection ─────────────────────────────────────────

export function lockNote(id: number, userId: number, password: string): void {
  getNoteRaw(id, userId); // verifies ownership

  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET passwordHash = ?, updatedAt = ? WHERE id = ?", [hash, now, id]);
  saveDb();
}

export function unlockNote(id: number, userId: number, password: string): void {
  const note = getNoteRaw(id, userId);
  if (!note.isLocked) {
    throw new AppError(400, "Note is not locked", "NOT_LOCKED");
  }

  // Verify password by reading the hash directly
  const db = getDb();
  const result = db.exec("SELECT passwordHash FROM Note WHERE id = ?", [id]);
  const hash = result[0].values[0][0] as string;

  if (!bcrypt.compareSync(password, hash)) {
    throw new AppError(403, "Incorrect password", "WRONG_PASSWORD");
  }

  const now = new Date().toISOString();
  db.run("UPDATE Note SET passwordHash = NULL, updatedAt = ? WHERE id = ?", [now, id]);
  saveDb();
}

export function accessLockedNote(id: number, userId: number, password: string): NoteDto {
  const note = getNoteRaw(id, userId);
  if (!note.isLocked) {
    return note;
  }

  // Verify password
  const db = getDb();
  const result = db.exec("SELECT passwordHash FROM Note WHERE id = ?", [id]);
  const hash = result[0].values[0][0] as string;

  if (!bcrypt.compareSync(password, hash)) {
    throw new AppError(403, "Incorrect password", "WRONG_PASSWORD");
  }

  return note; // full content since getNoteRaw doesn't hide it
}
