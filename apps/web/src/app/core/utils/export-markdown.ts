import TurndownService from 'turndown';

export function exportNoteAsMarkdown(title: string, html: string): void {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });

  // Strikethrough support (TipTap uses <s> or <del>)
  turndown.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => `~~${content}~~`,
  });

  // Task list support (TipTap renders checkboxes as <input type="checkbox">)
  turndown.addRule('taskListItem', {
    filter: (node) =>
      node.nodeName === 'LI' &&
      node.querySelector('input[type="checkbox"]') !== null,
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const checked = checkbox?.checked ? 'x' : ' ';
      // Remove the checkbox from the text content
      const text = el.textContent?.replace(/^\s*/, '') ?? '';
      return `- [${checked}] ${text}\n`;
    },
  });

  const markdown = `# ${title}\n\n${turndown.turndown(html)}`;

  // Sanitize filename: remove characters not allowed in filenames
  const sanitized = title.replace(/[<>:"/\\|?*]+/g, '').trim() || 'note';
  const filename = `${sanitized}.md`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
