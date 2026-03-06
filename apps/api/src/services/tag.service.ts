import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { getNoteById } from "./note.service.js";
import type { TagDto, TagWithCountDto, TaggedNoteDto } from "@noteflow/shared-types";

function rowToTag(row: unknown[]): TagDto {
  return {
    id: row[0] as number,
    name: row[1] as string,
    createdAt: row[2] as string,
  };
}

export function getUserTags(userId: number): TagWithCountDto[] {
  const db = getDb();
  const result = db.exec(
    `SELECT t.id, t.name, COUNT(nt.noteId) AS noteCount
     FROM Tag t
     LEFT JOIN NoteTag nt ON nt.tagId = t.id
     LEFT JOIN Note n ON n.id = nt.noteId AND n.archivedAt IS NULL
     WHERE t.userId = ?
     GROUP BY t.id
     ORDER BY t.name COLLATE NOCASE ASC`,
    [userId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    noteCount: row[2] as number,
  }));
}

export function getNotesByTag(tagId: number, userId: number): TaggedNoteDto[] {
  // Verify tag ownership
  const db = getDb();
  const tagResult = db.exec("SELECT id FROM Tag WHERE id = ? AND userId = ?", [tagId, userId]);
  if (tagResult.length === 0 || tagResult[0].values.length === 0) {
    throw new AppError(404, "Tag not found", "NOT_FOUND");
  }

  const result = db.exec(
    `SELECT n.id, n.title, n.sectionId, s.title AS sectionTitle,
            s.notebookId, nb.title AS notebookTitle, n.updatedAt
     FROM NoteTag nt
     JOIN Note n ON n.id = nt.noteId
     JOIN Section s ON s.id = n.sectionId
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nt.tagId = ? AND nb.userId = ? AND n.archivedAt IS NULL
     ORDER BY n.updatedAt DESC`,
    [tagId, userId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    title: row[1] as string,
    sectionId: row[2] as number,
    sectionTitle: row[3] as string,
    notebookId: row[4] as number,
    notebookTitle: row[5] as string,
    updatedAt: row[6] as string,
  }));
}

export function getTagsForNote(noteId: number, userId: number): TagDto[] {
  getNoteById(noteId, userId); // verifies ownership

  const db = getDb();
  const result = db.exec(
    `SELECT t.id, t.name, t.createdAt
     FROM Tag t
     JOIN NoteTag nt ON nt.tagId = t.id
     WHERE nt.noteId = ?
     ORDER BY t.name COLLATE NOCASE ASC`,
    [noteId]
  );

  if (result.length === 0) return [];
  return result[0].values.map(rowToTag);
}

export function createTag(userId: number, name: string): TagDto {
  const db = getDb();

  // Check uniqueness
  const existing = db.exec(
    "SELECT id, name, createdAt FROM Tag WHERE userId = ? AND name = ? COLLATE NOCASE",
    [userId, name]
  );
  if (existing.length > 0 && existing[0].values.length > 0) {
    return rowToTag(existing[0].values[0]);
  }

  const now = new Date().toISOString();
  db.run("INSERT INTO Tag (userId, name, createdAt) VALUES (?, ?, ?)", [userId, name, now]);

  const idResult = db.exec("SELECT last_insert_rowid() as id");
  const id = idResult[0].values[0][0] as number;
  saveDb();

  return { id, name, createdAt: now };
}

export function renameTag(tagId: number, userId: number, name: string): TagDto {
  const db = getDb();

  const tagResult = db.exec("SELECT id, name, createdAt FROM Tag WHERE id = ? AND userId = ?", [tagId, userId]);
  if (tagResult.length === 0 || tagResult[0].values.length === 0) {
    throw new AppError(404, "Tag not found", "NOT_FOUND");
  }

  // Check if name already taken
  const existing = db.exec(
    "SELECT id FROM Tag WHERE userId = ? AND name = ? COLLATE NOCASE AND id != ?",
    [userId, name, tagId]
  );
  if (existing.length > 0 && existing[0].values.length > 0) {
    throw new AppError(409, "A tag with that name already exists", "DUPLICATE_TAG");
  }

  db.run("UPDATE Tag SET name = ? WHERE id = ?", [name, tagId]);
  saveDb();

  const tag = rowToTag(tagResult[0].values[0]);
  return { ...tag, name };
}

export function deleteTag(tagId: number, userId: number): void {
  const db = getDb();

  const tagResult = db.exec("SELECT id FROM Tag WHERE id = ? AND userId = ?", [tagId, userId]);
  if (tagResult.length === 0 || tagResult[0].values.length === 0) {
    throw new AppError(404, "Tag not found", "NOT_FOUND");
  }

  db.run("DELETE FROM Tag WHERE id = ?", [tagId]);
  saveDb();
}

export function addTagToNote(noteId: number, tagName: string, userId: number): TagDto {
  getNoteById(noteId, userId); // verifies ownership

  // Find or create the tag
  const tag = createTag(userId, tagName);

  const db = getDb();
  // Insert into NoteTag, ignore if already exists
  const existing = db.exec("SELECT noteId FROM NoteTag WHERE noteId = ? AND tagId = ?", [noteId, tag.id]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    db.run("INSERT INTO NoteTag (noteId, tagId) VALUES (?, ?)", [noteId, tag.id]);
    saveDb();
  }

  return tag;
}

export function removeTagFromNote(noteId: number, tagId: number, userId: number): void {
  getNoteById(noteId, userId); // verifies ownership

  const db = getDb();
  db.run("DELETE FROM NoteTag WHERE noteId = ? AND tagId = ?", [noteId, tagId]);
  saveDb();
}
