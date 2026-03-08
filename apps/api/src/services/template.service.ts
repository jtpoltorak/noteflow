import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import type { UserTemplateDto } from "@noteflow/shared-types";

function rowToTemplate(row: unknown[]): UserTemplateDto {
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string,
    content: row[3] as string,
    category: row[4] as string,
    createdAt: row[5] as string,
    updatedAt: row[6] as string,
  };
}

export function getUserTemplates(userId: number): UserTemplateDto[] {
  const db = getDb();
  const result = db.exec(
    "SELECT id, name, description, content, category, createdAt, updatedAt FROM UserTemplate WHERE userId = ? ORDER BY name COLLATE NOCASE ASC",
    [userId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(rowToTemplate);
}

export function getUserTemplateById(id: number, userId: number): UserTemplateDto {
  const db = getDb();
  const result = db.exec(
    "SELECT id, name, description, content, category, createdAt, updatedAt FROM UserTemplate WHERE id = ? AND userId = ?",
    [id, userId]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "Template not found", "NOT_FOUND");
  }
  return rowToTemplate(result[0].values[0]);
}

export function createUserTemplate(
  userId: number,
  data: { name: string; description?: string; content: string; category?: string }
): UserTemplateDto {
  const db = getDb();
  const now = new Date().toISOString();

  db.run(
    "INSERT INTO UserTemplate (userId, name, description, content, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, data.name, data.description ?? "", data.content, data.category ?? "Custom", now, now]
  );
  saveDb();

  const result = db.exec("SELECT last_insert_rowid()");
  const id = result[0].values[0][0] as number;
  return getUserTemplateById(id, userId);
}

export function updateUserTemplate(
  id: number,
  userId: number,
  updates: { name?: string; description?: string; content?: string; category?: string }
): UserTemplateDto {
  getUserTemplateById(id, userId); // throws 404 if not owned

  const db = getDb();
  const now = new Date().toISOString();
  const fields: string[] = ["updatedAt = ?"];
  const params: (string | number)[] = [now];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    params.push(updates.description);
  }
  if (updates.content !== undefined) {
    fields.push("content = ?");
    params.push(updates.content);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    params.push(updates.category);
  }

  params.push(id, userId);
  db.run(`UPDATE UserTemplate SET ${fields.join(", ")} WHERE id = ? AND userId = ?`, params);
  saveDb();

  return getUserTemplateById(id, userId);
}

export function deleteUserTemplate(id: number, userId: number): void {
  getUserTemplateById(id, userId); // throws 404 if not owned

  const db = getDb();
  db.run("DELETE FROM UserTemplate WHERE id = ? AND userId = ?", [id, userId]);
  saveDb();
}
