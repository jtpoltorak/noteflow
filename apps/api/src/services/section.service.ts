import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getNotebookById, getNotebookByIdIncludeDeleted } from "./notebook.service.js";
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
    'SELECT id, notebookId, title, "order", createdAt, updatedAt FROM Section WHERE notebookId = ? AND deletedAt IS NULL ORDER BY "order" ASC, id ASC',
    [notebookId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToSection);
}

/** Get a single section, verifying ownership through notebook. */
export function getSectionById(id: number, userId: number): SectionDto {
  const db = getDb();
  const result = db.exec(
    'SELECT id, notebookId, title, "order", createdAt, updatedAt FROM Section WHERE id = ? AND deletedAt IS NULL',
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
  updates: { title?: string; order?: number; notebookId?: number }
): SectionDto {
  const existing = getSectionById(id, userId); // verifies ownership

  const db = getDb();
  const now = new Date().toISOString();
  const title = updates.title ?? existing.title;
  let order = updates.order ?? existing.order;
  let notebookId = existing.notebookId;

  if (updates.notebookId && updates.notebookId !== existing.notebookId) {
    // Verify ownership of target notebook
    getNotebookById(updates.notebookId, userId);
    notebookId = updates.notebookId;
    // Place at end of target notebook's section list
    const maxResult = db.exec(
      'SELECT COALESCE(MAX("order"), -1) FROM Section WHERE notebookId = ?',
      [notebookId]
    );
    order = (maxResult[0].values[0][0] as number) + 1;
  }

  db.run(
    'UPDATE Section SET title = ?, "order" = ?, notebookId = ?, updatedAt = ? WHERE id = ?',
    [title, order, notebookId, now, id]
  );
  saveDb();

  return { ...existing, title, order, notebookId, updatedAt: now };
}

export function deleteSection(id: number, userId: number, permanent = false): void {
  getSectionById(id, userId); // verifies ownership

  const db = getDb();
  if (permanent) {
    // Hard delete — cascade via FK handles notes
    db.run("DELETE FROM Section WHERE id = ?", [id]);
  } else {
    const now = new Date().toISOString();
    // Soft-delete the section and cascade to its notes
    db.run("UPDATE Section SET deletedAt = ? WHERE id = ?", [now, id]);
    db.run("UPDATE Note SET deletedAt = ? WHERE sectionId = ? AND deletedAt IS NULL", [now, id]);
  }
  saveDb();
}

/** Internal: get a section by id regardless of deletedAt status. Used by recycle-bin. */
export function getSectionByIdIncludeDeleted(id: number, userId: number): SectionDto & { deletedAt: string | null } {
  const db = getDb();
  const result = db.exec(
    'SELECT id, notebookId, title, "order", createdAt, updatedAt, deletedAt FROM Section WHERE id = ?',
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Section not found", "NOT_FOUND");
  }
  const row = result[0].values[0];
  const section = rowToSection(row);

  // Verify ownership through notebook (include deleted notebooks)
  getNotebookByIdIncludeDeleted(section.notebookId, userId);

  return { ...section, deletedAt: (row[6] as string | null) ?? null };
}
