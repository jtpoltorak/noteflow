import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getNotebookById } from "./notebook.service.js";
import type { SectionDto } from "@noteflow/shared-types";

function rowToSection(row: unknown[]): SectionDto {
  return {
    id: row[0] as number,
    notebookId: row[1] as number,
    title: row[2] as string,
    order: row[3] as number,
    createdAt: row[4] as string,
    updatedAt: row[5] as string,
  };
}

/** Verify the notebook belongs to the user, then return sections. */
export function getSectionsByNotebook(notebookId: number, userId: number): SectionDto[] {
  getNotebookById(notebookId, userId); // throws 404 if not owned

  const db = getDb();
  const result = db.exec(
    'SELECT id, notebookId, title, "order", createdAt, updatedAt FROM Section WHERE notebookId = ? ORDER BY "order" ASC, id ASC',
    [notebookId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToSection);
}

/** Get a single section, verifying ownership through notebook. */
export function getSectionById(id: number, userId: number): SectionDto {
  const db = getDb();
  const result = db.exec(
    'SELECT id, notebookId, title, "order", createdAt, updatedAt FROM Section WHERE id = ?',
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Section not found", "NOT_FOUND");
  }
  const section = rowToSection(result[0].values[0]);

  // Verify ownership through notebook
  getNotebookById(section.notebookId, userId);

  return section;
}

export function createSection(notebookId: number, userId: number, title: string): SectionDto {
  getNotebookById(notebookId, userId); // throws 404 if not owned

  const db = getDb();
  const now = new Date().toISOString();

  // Set order to max + 1
  const maxResult = db.exec(
    'SELECT COALESCE(MAX("order"), -1) FROM Section WHERE notebookId = ?',
    [notebookId]
  );
  const nextOrder = (maxResult[0].values[0][0] as number) + 1;

  db.run(
    'INSERT INTO Section (notebookId, title, "order", createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [notebookId, title, nextOrder, now, now]
  );

  const idResult = db.exec("SELECT last_insert_rowid() as id");
  const id = idResult[0].values[0][0] as number;
  saveDb();

  return { id, notebookId, title, order: nextOrder, createdAt: now, updatedAt: now };
}

export function updateSection(
  id: number,
  userId: number,
  updates: { title?: string; order?: number }
): SectionDto {
  const existing = getSectionById(id, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();
  const title = updates.title ?? existing.title;
  const order = updates.order ?? existing.order;

  db.run(
    'UPDATE Section SET title = ?, "order" = ?, updatedAt = ? WHERE id = ?',
    [title, order, now, id]
  );
  saveDb();

  return { ...existing, title, order, updatedAt: now };
}

export function deleteSection(id: number, userId: number): void {
  getSectionById(id, userId); // verifies ownership

  const db = getDb();
  db.run("DELETE FROM Section WHERE id = ?", [id]);
  saveDb();
}
