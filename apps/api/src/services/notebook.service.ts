import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import type { NotebookDto } from "@noteflow/shared-types";

function rowToNotebook(row: unknown[]): NotebookDto {
  return {
    id: row[0] as number,
    title: row[1] as string,
    createdAt: row[2] as string,
    updatedAt: row[3] as string,
  };
}

export function getAllNotebooks(userId: number): NotebookDto[] {
  const db = getDb();
  const result = db.exec(
    "SELECT id, title, createdAt, updatedAt FROM Notebook WHERE userId = ? ORDER BY updatedAt DESC",
    [userId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToNotebook);
}

export function getNotebookById(id: number, userId: number): NotebookDto {
  const db = getDb();
  const result = db.exec(
    "SELECT id, title, createdAt, updatedAt FROM Notebook WHERE id = ? AND userId = ?",
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

  db.run(
    "INSERT INTO Notebook (userId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
    [userId, title, now, now]
  );

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id = result[0].values[0][0] as number;
  saveDb();

  return { id, title, createdAt: now, updatedAt: now };
}

export function updateNotebook(id: number, userId: number, title: string): NotebookDto {
  // Verify ownership
  getNotebookById(id, userId);

  const db = getDb();
  const now = new Date().toISOString();

  db.run("UPDATE Notebook SET title = ?, updatedAt = ? WHERE id = ?", [title, now, id]);
  saveDb();

  return getNotebookById(id, userId);
}

export function deleteNotebook(id: number, userId: number): void {
  // Verify ownership
  getNotebookById(id, userId);

  const db = getDb();
  db.run("DELETE FROM Notebook WHERE id = ?", [id]);
  saveDb();
}
