import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getSectionById } from "./section.service.js";
import type { NoteDto } from "@noteflow/shared-types";

function rowToNote(row: unknown[]): NoteDto {
  return {
    id: row[0] as number,
    sectionId: row[1] as number,
    title: row[2] as string,
    content: row[3] as string,
    order: row[4] as number,
    createdAt: row[5] as string,
    updatedAt: row[6] as string,
  };
}

export function getNotesBySection(sectionId: number, userId: number): NoteDto[] {
  getSectionById(sectionId, userId); // verifies ownership

  const db = getDb();
  const result = db.exec(
    'SELECT id, sectionId, title, content, "order", createdAt, updatedAt FROM Note WHERE sectionId = ? ORDER BY "order" ASC, id ASC',
    [sectionId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToNote);
}

export function getNoteById(id: number, userId: number): NoteDto {
  const db = getDb();
  const result = db.exec(
    'SELECT id, sectionId, title, content, "order", createdAt, updatedAt FROM Note WHERE id = ?',
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Note not found", "NOT_FOUND");
  }
  const note = rowToNote(result[0].values[0]);

  // Verify ownership through section → notebook → user
  getSectionById(note.sectionId, userId);

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

  return { id, sectionId, title, content, order: nextOrder, createdAt: now, updatedAt: now };
}

export function updateNote(
  id: number,
  userId: number,
  updates: { title?: string; content?: string; order?: number }
): NoteDto {
  const existing = getNoteById(id, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();
  const title = updates.title ?? existing.title;
  const content = updates.content ?? existing.content;
  const order = updates.order ?? existing.order;

  db.run(
    'UPDATE Note SET title = ?, content = ?, "order" = ?, updatedAt = ? WHERE id = ?',
    [title, content, order, now, id]
  );
  saveDb();

  return { ...existing, title, content, order, updatedAt: now };
}

export function deleteNote(id: number, userId: number): void {
  getNoteById(id, userId); // verifies ownership

  const db = getDb();
  db.run("DELETE FROM Note WHERE id = ?", [id]);
  saveDb();
}
