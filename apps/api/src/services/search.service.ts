import { getDb } from "../db/database.js";
import type { SearchResultDto } from "@noteflow/shared-types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function buildSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 120);

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";

  return snippet;
}

export function searchNotes(userId: number, query: string, includeArchived: boolean = false): SearchResultDto[] {
  const db = getDb();
  const likePattern = `%${query}%`;

  const archiveFilter = includeArchived ? "" : "AND n.archivedAt IS NULL";
  const deletedFilter = "AND n.deletedAt IS NULL AND s.deletedAt IS NULL AND nb.deletedAt IS NULL";

  const result = db.exec(
    `SELECT n.id, n.title, n.content, n.sectionId, n.updatedAt,
            s.title AS sectionTitle, s.notebookId,
            nb.title AS notebookTitle, n.archivedAt
     FROM Note n
     JOIN Section s ON s.id = n.sectionId
     JOIN Notebook nb ON nb.id = s.notebookId
     WHERE nb.userId = ?
       AND (n.title LIKE ? OR n.content LIKE ?)
       ${archiveFilter}
       ${deletedFilter}
     ORDER BY n.updatedAt DESC
     LIMIT 50`,
    [userId, likePattern, likePattern]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const noteTitle = row[1] as string;
    const content = row[2] as string;
    const plainText = stripHtml(content);
    const snippet = noteTitle.toLowerCase().includes(query.toLowerCase())
      ? plainText.slice(0, 120)
      : buildSnippet(plainText, query);

    return {
      noteId: row[0] as number,
      noteTitle,
      sectionId: row[3] as number,
      updatedAt: row[4] as string,
      sectionTitle: row[5] as string,
      notebookId: row[6] as number,
      notebookTitle: row[7] as string,
      archivedAt: (row[8] as string | null) ?? null,
      snippet,
    };
  });
}
