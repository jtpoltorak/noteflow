import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getNotebookByIdIncludeDeleted } from "./notebook.service.js";
import { getSectionByIdIncludeDeleted } from "./section.service.js";
import type { RecycleBinDto, DeletedNotebookDto, DeletedSectionDto, DeletedNoteDto } from "@noteflow/shared-types";

const PURGE_DAYS = 30;

export function getDeletedItems(userId: number): RecycleBinDto {
  const db = getDb();

  // Deleted notebooks
  const nbResult = db.exec(
    `SELECT id, title, deletedAt
     FROM Notebook
     WHERE userId = ? AND deletedAt IS NOT NULL
     ORDER BY deletedAt DESC`,
    [userId]
  );
  const notebooks: DeletedNotebookDto[] = nbResult.length > 0
    ? nbResult[0].values.map((row) => ({
        id: row[0] as number,
        title: row[1] as string,
        deletedAt: row[2] as string,
      }))
    : [];

  // Deleted sections whose parent notebook is NOT deleted
  // (sections that were individually deleted, not cascade-deleted with a notebook)
  const secResult = db.exec(
    `SELECT s.id, s.title, s.notebookId, nb.title AS notebookTitle, s.deletedAt
     FROM Section s
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nb.userId = ? AND s.deletedAt IS NOT NULL AND nb.deletedAt IS NULL
     ORDER BY s.deletedAt DESC`,
    [userId]
  );
  const sections: DeletedSectionDto[] = secResult.length > 0
    ? secResult[0].values.map((row) => ({
        id: row[0] as number,
        title: row[1] as string,
        notebookId: row[2] as number,
        notebookTitle: row[3] as string,
        deletedAt: row[4] as string,
      }))
    : [];

  // Deleted notes whose parent section AND notebook are NOT deleted
  // (notes that were individually deleted, not cascade-deleted)
  const noteResult = db.exec(
    `SELECT n.id, n.title, n.sectionId, s.title AS sectionTitle,
            s.notebookId, nb.title AS notebookTitle, n.deletedAt
     FROM Note n
     JOIN Section s ON s.id = n.sectionId
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nb.userId = ? AND n.deletedAt IS NOT NULL AND s.deletedAt IS NULL AND nb.deletedAt IS NULL
     ORDER BY n.deletedAt DESC`,
    [userId]
  );
  const notes: DeletedNoteDto[] = noteResult.length > 0
    ? noteResult[0].values.map((row) => ({
        id: row[0] as number,
        title: row[1] as string,
        sectionId: row[2] as number,
        sectionTitle: row[3] as string,
        notebookId: row[4] as number,
        notebookTitle: row[5] as string,
        deletedAt: row[6] as string,
      }))
    : [];

  return { notebooks, sections, notes };
}

export function restoreNotebook(id: number, userId: number): void {
  getNotebookByIdIncludeDeleted(id, userId);

  const db = getDb();
  // Restore notebook and all its cascade-deleted children
  db.run("UPDATE Notebook SET deletedAt = NULL WHERE id = ?", [id]);
  db.run("UPDATE Section SET deletedAt = NULL WHERE notebookId = ?", [id]);
  db.run(
    "UPDATE Note SET deletedAt = NULL WHERE sectionId IN (SELECT id FROM Section WHERE notebookId = ?)",
    [id]
  );
  saveDb();
}

export function restoreSection(id: number, userId: number): void {
  const section = getSectionByIdIncludeDeleted(id, userId);
  if (!section.deletedAt) {
    throw new AppError(400, "Section is not deleted", "NOT_DELETED");
  }

  const db = getDb();
  // Also restore parent notebook if it was deleted
  const nbResult = db.exec("SELECT deletedAt FROM Notebook WHERE id = ?", [section.notebookId]);
  if (nbResult.length > 0 && nbResult[0].values[0][0]) {
    db.run("UPDATE Notebook SET deletedAt = NULL WHERE id = ?", [section.notebookId]);
  }

  // Restore section and its cascade-deleted notes
  db.run("UPDATE Section SET deletedAt = NULL WHERE id = ?", [id]);
  db.run("UPDATE Note SET deletedAt = NULL WHERE sectionId = ?", [id]);
  saveDb();
}

export function restoreNote(id: number, userId: number): void {
  const db = getDb();
  const result = db.exec(
    "SELECT id, sectionId FROM Note WHERE id = ? AND deletedAt IS NOT NULL",
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Deleted note not found", "NOT_FOUND");
  }
  const sectionId = result[0].values[0][1] as number;

  // Verify ownership through section → notebook
  const secResult = db.exec("SELECT notebookId FROM Section WHERE id = ?", [sectionId]);
  if (secResult.length === 0 || secResult[0].values.length === 0) {
    throw new AppError(404, "Section not found", "NOT_FOUND");
  }
  const notebookId = secResult[0].values[0][0] as number;
  const nbResult = db.exec("SELECT userId, deletedAt FROM Notebook WHERE id = ?", [notebookId]);
  if (nbResult.length === 0 || nbResult[0].values.length === 0 || nbResult[0].values[0][0] !== userId) {
    throw new AppError(404, "Note not found", "NOT_FOUND");
  }

  // Also restore parent section and notebook if they were deleted
  if (nbResult[0].values[0][1]) {
    db.run("UPDATE Notebook SET deletedAt = NULL WHERE id = ?", [notebookId]);
  }
  const secDeletedResult = db.exec("SELECT deletedAt FROM Section WHERE id = ?", [sectionId]);
  if (secDeletedResult.length > 0 && secDeletedResult[0].values[0][0]) {
    db.run("UPDATE Section SET deletedAt = NULL WHERE id = ?", [sectionId]);
  }

  db.run("UPDATE Note SET deletedAt = NULL WHERE id = ?", [id]);
  saveDb();
}

export function permanentlyDeleteNotebook(id: number, userId: number): void {
  const nb = getNotebookByIdIncludeDeleted(id, userId);
  if (!nb.deletedAt) {
    throw new AppError(400, "Notebook is not in recycle bin", "NOT_DELETED");
  }

  const db = getDb();
  db.run("DELETE FROM Notebook WHERE id = ?", [id]);
  saveDb();
}

export function permanentlyDeleteSection(id: number, userId: number): void {
  const section = getSectionByIdIncludeDeleted(id, userId);
  if (!section.deletedAt) {
    throw new AppError(400, "Section is not in recycle bin", "NOT_DELETED");
  }

  const db = getDb();
  db.run("DELETE FROM Section WHERE id = ?", [id]);
  saveDb();
}

export function permanentlyDeleteNote(id: number, userId: number): void {
  const db = getDb();
  const result = db.exec(
    "SELECT n.id FROM Note n JOIN Section s ON s.id = n.sectionId JOIN Notebook nb ON nb.id = s.notebookId WHERE n.id = ? AND nb.userId = ? AND n.deletedAt IS NOT NULL",
    [id, userId]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Deleted note not found", "NOT_FOUND");
  }

  db.run("DELETE FROM Note WHERE id = ?", [id]);
  saveDb();
}

export function emptyRecycleBin(userId: number): void {
  const db = getDb();
  // Delete all soft-deleted items for user (notes first due to FK)
  db.run(
    "DELETE FROM Note WHERE deletedAt IS NOT NULL AND sectionId IN (SELECT s.id FROM Section s JOIN Notebook nb ON nb.id = s.notebookId WHERE nb.userId = ?)",
    [userId]
  );
  db.run(
    "DELETE FROM Section WHERE deletedAt IS NOT NULL AND notebookId IN (SELECT id FROM Notebook WHERE userId = ?)",
    [userId]
  );
  db.run("DELETE FROM Notebook WHERE deletedAt IS NOT NULL AND userId = ?", [userId]);
  saveDb();
}

export function purgeExpiredItems(): void {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PURGE_DAYS);
  const cutoffStr = cutoff.toISOString();

  // Purge old soft-deleted notebooks (cascade handles sections/notes via FK)
  db.run("DELETE FROM Notebook WHERE deletedAt IS NOT NULL AND deletedAt < ?", [cutoffStr]);
  // Purge old soft-deleted sections (cascade handles notes via FK)
  db.run("DELETE FROM Section WHERE deletedAt IS NOT NULL AND deletedAt < ?", [cutoffStr]);
  // Purge old soft-deleted notes
  db.run("DELETE FROM Note WHERE deletedAt IS NOT NULL AND deletedAt < ?", [cutoffStr]);
  saveDb();
}
