import { marked } from 'marked';

export interface ParsedMarkdown {
  title: string;
  html: string;
}

export function parseMarkdownFile(file: File): Promise<ParsedMarkdown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;

      // Extract title from first # heading, fall back to filename
      const headingMatch = text.match(/^#\s+(.+)$/m);
      const title = headingMatch
        ? headingMatch[1].trim()
        : file.name.replace(/\.md$/i, '');

      // Strip the # heading line from content to avoid duplication
      const content = headingMatch
        ? text.replace(/^#\s+.+\n?/, '').trim()
        : text.trim();

      const html = marked.parse(content, { async: false }) as string;
      resolve({ title, html });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
