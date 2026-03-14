function downloadHtml(title: string, doc: string): void {
  const sanitized = title.replace(/[<>:"/\\|?*]+/g, '').trim() || 'note';
  const filename = `${sanitized}.html`;
  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getStyledCss(fontFamily: string): string {
  return `
    body {
      font-family: ${fontFamily};
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
      color: #1f2937;
      line-height: 1.6;
    }
    h1.note-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }
    h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75rem 0 0.5rem; line-height: 1.2; }
    h2 { font-size: 1.5rem; font-weight: 600; margin: 0.625rem 0 0.375rem; line-height: 1.25; }
    h3 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0 0.25rem; line-height: 1.3; }
    p { margin-bottom: 0.5rem; }
    ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
    ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
    li { margin-bottom: 0.125rem; }
    li p { margin-bottom: 0; }
    li > ul, li > ol { margin-bottom: 0; }
    pre {
      background: #f3f4f6;
      border-radius: 0.375rem;
      padding: 0.75rem 1rem;
      margin: 0.5rem 0;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    pre code { background: none; padding: 0; font-size: inherit; }
    code {
      background: #f3f4f6;
      border-radius: 0.25rem;
      padding: 0.125rem 0.25rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
    }
    blockquote {
      border-left: 3px solid #d1d5db;
      padding: 0.5rem 1rem;
      margin: 0.5rem 0;
      font-style: italic;
      color: #6b7280;
    }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 1rem 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 0.375rem 0.625rem; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
    th p, td p { margin-bottom: 0; }
    img { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.5rem 0; }
    a { color: #3b82f6; text-decoration: underline; text-underline-offset: 2px; }
    a:hover { color: #2563eb; }
    a.note-link {
      color: #8b5cf6;
      text-decoration: none;
      border-bottom: 1px dashed #8b5cf6;
      padding: 0 2px;
      border-radius: 2px;
    }
    ul[data-type="taskList"] { list-style: none; padding-left: 0; margin-bottom: 0.5rem; }
    ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem; }
    ul[data-type="taskList"] li label { display: flex; align-items: center; margin-top: 0.35rem; flex-shrink: 0; }
    ul[data-type="taskList"] li label input[type="checkbox"] { width: 1rem; height: 1rem; accent-color: #3b82f6; }
    ul[data-type="taskList"] li > div { flex: 1; min-width: 0; }
    ul[data-type="taskList"] li[data-checked="true"] > div p { text-decoration: line-through; color: #9ca3af; }
    div[data-youtube-video] { position: relative; width: 100%; max-width: 640px; margin: 0.75rem 0; }
    div[data-youtube-video] iframe { width: 100%; aspect-ratio: 16 / 9; height: auto; border: none; border-radius: 0.5rem; }
    /* Syntax highlighting */
    .hljs-comment, .hljs-quote { color: #6b7280; font-style: italic; }
    .hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-literal { color: #7c3aed; }
    .hljs-number, .hljs-attr { color: #d97706; }
    .hljs-string, .hljs-doctag, .hljs-regexp { color: #059669; }
    .hljs-title, .hljs-title.function_, .hljs-section { color: #2563eb; font-weight: 600; }
    .hljs-type, .hljs-title.class_ { color: #0891b2; }
    .hljs-variable, .hljs-template-variable { color: #dc2626; }
    .hljs-meta { color: #9ca3af; }
    .hljs-tag { color: #6b7280; }
    .hljs-name { color: #2563eb; }
    .hljs-attribute { color: #7c3aed; }
    .hljs-symbol, .hljs-bullet, .hljs-link { color: #059669; }
    .hljs-addition { color: #059669; background-color: rgba(5, 150, 105, 0.1); }
    .hljs-deletion { color: #dc2626; background-color: rgba(220, 38, 38, 0.1); }
    .hljs-emphasis { font-style: italic; }
    .hljs-strong { font-weight: 700; }`;
}

export function getFontFamily(serif: boolean): string {
  return serif
    ? "'Source Serif 4', 'Georgia', serif"
    : "'Source Sans 3', 'Segoe UI', sans-serif";
}

export function exportNoteAsHtml(title: string, html: string): void {
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;

  downloadHtml(title, doc);
}

export function exportNoteAsStyledHtml(title: string, html: string, serif = false): void {
  const doc = buildStyledDocument(title, html, serif);
  downloadHtml(title, doc);
}

export function buildStyledDocument(title: string, html: string, serif: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${getStyledCss(getFontFamily(serif))}</style>
</head>
<body>
  <h1 class="note-title">${title}</h1>
  ${html}
</body>
</html>`;
}
