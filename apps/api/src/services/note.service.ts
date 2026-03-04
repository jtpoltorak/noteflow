import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getSectionById } from "./section.service.js";
import type { NoteDto, ArchivedNoteDto, FavoriteNoteDto } from "@noteflow/shared-types";

function rowToNote(row: unknown[]): NoteDto {
  return {
    id: row[0] as number,
    sectionId: row[1] as number,
    title: row[2] as string,
    content: row[3] as string,
    order: row[4] as number,
    archivedAt: (row[5] as string | null) ?? null,
    favoritedAt: (row[6] as string | null) ?? null,
    createdAt: row[7] as string,
    updatedAt: row[8] as string,
  };
}

export function getNotesBySection(sectionId: number, userId: number): NoteDto[] {
  getSectionById(sectionId, userId); // verifies ownership

  const db = getDb();
  const result = db.exec(
    'SELECT id, sectionId, title, content, "order", archivedAt, favoritedAt, createdAt, updatedAt FROM Note WHERE sectionId = ? AND archivedAt IS NULL ORDER BY "order" ASC, id ASC',
    [sectionId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToNote);
}

export function getNoteById(id: number, userId: number): NoteDto {
  const db = getDb();
  const result = db.exec(
    'SELECT id, sectionId, title, content, "order", archivedAt, favoritedAt, createdAt, updatedAt FROM Note WHERE id = ?',
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

  return { id, sectionId, title, content, order: nextOrder, archivedAt: null, favoritedAt: null, createdAt: now, updatedAt: now };
}

export function updateNote(
  id: number,
  userId: number,
  updates: { title?: string; content?: string; order?: number; sectionId?: number }
): NoteDto {
  const existing = getNoteById(id, userId); // verifies ownership

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
  getNoteById(id, userId); // verifies ownership

  const db = getDb();
  db.run("DELETE FROM Note WHERE id = ?", [id]);
  saveDb();
}

export function archiveNote(id: number, userId: number): void {
  const note = getNoteById(id, userId);
  if (note.archivedAt) {
    throw new AppError(400, "Note is already archived", "ALREADY_ARCHIVED");
  }

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET archivedAt = ?, updatedAt = ? WHERE id = ?", [now, now, id]);
  saveDb();
}

export function unarchiveNote(id: number, userId: number, targetSectionId: number): void {
  const note = getNoteById(id, userId);
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
  const note = getNoteById(id, userId);
  if (note.favoritedAt) {
    throw new AppError(400, "Note is already favorited", "ALREADY_FAVORITED");
  }

  const db = getDb();
  const now = new Date().toISOString();
  db.run("UPDATE Note SET favoritedAt = ?, updatedAt = ? WHERE id = ?", [now, now, id]);
  saveDb();
}

export function unfavoriteNote(id: number, userId: number): void {
  const note = getNoteById(id, userId);
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
     WHERE nb.userId = ? AND n.favoritedAt IS NOT NULL AND n.archivedAt IS NULL
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
     WHERE nb.userId = ? AND n.archivedAt IS NOT NULL
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
