import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import type { NotebookDto } from "@noteflow/shared-types";

function rowToNotebook(row: unknown[]): NotebookDto {
  return {
    id: row[0] as number,
    title: row[1] as string,
    order: row[2] as number,
    createdAt: row[3] as string,
    updatedAt: row[4] as string,
  };
}

export function getAllNotebooks(userId: number): NotebookDto[] {
  const db = getDb();
  const result = db.exec(
    'SELECT id, title, "order", createdAt, updatedAt FROM Notebook WHERE userId = ? AND deletedAt IS NULL ORDER BY "order" ASC, id ASC',
    [userId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToNotebook);
}

export function getNotebookById(id: number, userId: number): NotebookDto {
  const db = getDb();
  const result = db.exec(
    'SELECT id, title, "order", createdAt, updatedAt FROM Notebook WHERE id = ? AND userId = ? AND deletedAt IS NULL',
    [id, userId]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Notebook not found", "NOT_FOUND");
  }
  return rowToNotebook(result[0].values[0]);
}

export function createNotebook(userId: number, title: string): NotebookDto {
  const db = getDb();
  const now = new Date().toISOString();

  const maxResult = db.exec(
    'SELECT COALESCE(MAX("order"), -1) FROM Notebook WHERE userId = ?',
    [userId]
  );
  const nextOrder = (maxResult[0].values[0][0] as number) + 1;

  db.run(
    'INSERT INTO Notebook (userId, title, "order", createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [userId, title, nextOrder, now, now]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0].values[0][0] as number;
  saveDb();

  return { id, title, order: nextOrder, createdAt: now, updatedAt: now };
}

export function updateNotebook(
  id: number,
  userId: number,
  updates: { title?: string; order?: number }
): NotebookDto {
  const existing = getNotebookById(id, userId);

  const db = getDb();
  const now = new Date().toISOString();
  const title = updates.title ?? existing.title;
  const order = updates.order ?? existing.order;

  db.run(
    'UPDATE Notebook SET title = ?, "order" = ?, updatedAt = ? WHERE id = ?',
    [title, order, now, id]
  );
  saveDb();

  return { ...existing, title, order, updatedAt: now };
}

export function deleteNotebook(id: number, userId: number): void {
  // Verify ownership
  getNotebookById(id, userId);

  const db = getDb();
  const now = new Date().toISOString();
  // Soft-delete the notebook and cascade to its sections and notes
  db.run("UPDATE Notebook SET deletedAt = ? WHERE id = ?", [now, id]);
  db.run("UPDATE Section SET deletedAt = ? WHERE notebookId = ? AND deletedAt IS NULL", [now, id]);
  db.run(
    "UPDATE Note SET deletedAt = ? WHERE sectionId IN (SELECT id FROM Section WHERE notebookId = ?) AND deletedAt IS NULL",
    [now, id]
  );
  saveDb();
}

/** Internal: get a notebook by id regardless of deletedAt status. Used by recycle-bin. */
export function getNotebookByIdIncludeDeleted(id: number, userId: number): NotebookDto & { deletedAt: string | null } {
  const db = getDb();
  const result = db.exec(
    'SELECT id, title, "order", createdAt, updatedAt, deletedAt FROM Notebook WHERE id = ? AND userId = ?',
    [id, userId]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Notebook not found", "NOT_FOUND");
  }
  const row = result[0].values[0];
  return { ...rowToNotebook(row), deletedAt: (row[5] as string | null) ?? null };
}
