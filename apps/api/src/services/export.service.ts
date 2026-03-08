import archiver from "archiver";
import { getDb } from "../db/database.js";
import type { Writable } from "stream";

interface ExportNote {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isLocked: boolean;
  favoritedAt: string | null;
  archivedAt: string | null;
  shareToken: string | null;
}

interface ExportSection {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  notes: ExportNote[];
}

interface ExportNotebook {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  sections: ExportSection[];
}

interface ExportData {
  exportedAt: string;
  format: string;
  user: { id: number; email: string };
  notebooks: ExportNotebook[];
}

function buildExportData(userId: number, email: string): ExportData {
  const db = getDb();

  // All notebooks
  const nbResult = db.exec(
    'SELECT id, title, createdAt, updatedAt FROM Notebook WHERE userId = ? ORDER BY "order" ASC, id ASC',
    [userId]
  );
  const notebooks: ExportNotebook[] = [];

  if (nbResult.length > 0) {
    for (const nbRow of nbResult[0].values) {
      const nbId = nbRow[0] as number;

      // Sections for this notebook
      const secResult = db.exec(
        'SELECT id, title, createdAt, updatedAt FROM Section WHERE notebookId = ? ORDER BY "order" ASC, id ASC',
        [nbId]
      );
      const sections: ExportSection[] = [];

      if (secResult.length > 0) {
        for (const secRow of secResult[0].values) {
          const secId = secRow[0] as number;

          // Notes for this section
          const noteResult = db.exec(
            `SELECT id, title, content, createdAt, updatedAt, passwordHash, favoritedAt, archivedAt, shareToken
             FROM Note WHERE sectionId = ? ORDER BY "order" ASC, id ASC`,
            [secId]
          );
          const notes: ExportNote[] = [];

          if (noteResult.length > 0) {
            for (const noteRow of noteResult[0].values) {
              const noteId = noteRow[0] as number;
              const isLocked = !!(noteRow[5] as string | null);

              // Tags for this note
              const tagResult = db.exec(
                `SELECT t.name FROM Tag t
                 JOIN NoteTag nt ON nt.tagId = t.id
                 WHERE nt.noteId = ?
                 ORDER BY t.name COLLATE NOCASE ASC`,
                [noteId]
              );
              const tags = tagResult.length > 0
                ? tagResult[0].values.map((r) => r[0] as string)
                : [];

              notes.push({
                id: noteId,
                title: noteRow[1] as string,
                content: isLocked ? "[locked]" : (noteRow[2] as string),
                createdAt: noteRow[3] as string,
                updatedAt: noteRow[4] as string,
                tags,
                isLocked,
                favoritedAt: (noteRow[6] as string | null) ?? null,
                archivedAt: (noteRow[7] as string | null) ?? null,
                shareToken: (noteRow[8] as string | null) ?? null,
              });
            }
          }

          sections.push({
            id: secId,
            title: secRow[1] as string,
            createdAt: secRow[2] as string,
            updatedAt: secRow[3] as string,
            notes,
          });
        }
      }

      notebooks.push({
        id: nbId,
        title: nbRow[1] as string,
        createdAt: nbRow[2] as string,
        updatedAt: nbRow[3] as string,
        sections,
      });
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    format: "NoteFlow Export v1",
    user: { id: userId, email },
    notebooks,
  };
}

export function exportAsJson(userId: number, email: string): string {
  const data = buildExportData(userId, email);
  return JSON.stringify(data, null, 2);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim() || "untitled";
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "## ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function exportAsMarkdownZip(userId: number, email: string, output: Writable): void {
  const data = buildExportData(userId, email);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);

  for (const notebook of data.notebooks) {
    const nbFolder = sanitizeFilename(notebook.title);

    for (const section of notebook.sections) {
      const secFolder = sanitizeFilename(section.title);

      for (const note of section.notes) {
        const filename = `${sanitizeFilename(note.title)}.md`;
        const path = `${nbFolder}/${secFolder}/${filename}`;

        let md = `# ${note.title}\n\n`;

        if (note.tags.length > 0) {
          md += `**Tags:** ${note.tags.join(", ")}\n\n`;
        }

        if (note.isLocked) {
          md += `> This note is password-protected. Content cannot be exported.\n\n`;
        } else {
          md += htmlToPlainText(note.content) + "\n\n";
        }

        md += `---\n`;
        md += `Created: ${note.createdAt}\n`;
        md += `Updated: ${note.updatedAt}\n`;
        if (note.favoritedAt) md += `Favorited: ${note.favoritedAt}\n`;
        if (note.archivedAt) md += `Archived: ${note.archivedAt}\n`;

        archive.append(md, { name: path });
      }
    }
  }

  archive.finalize();
}
