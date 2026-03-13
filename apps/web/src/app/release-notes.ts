export interface ReleaseEntry {
  version: string;
  date: string;
  type: 'feature' | 'bugfix';
  description: string;
}

export const RELEASE_NOTES: ReleaseEntry[] = [
  {
    version: '0.4.0',
    date: '2026-03-13',
    type: 'feature',
    description: 'Embed YouTube videos via toolbar button, /youtube slash command, or by pasting a URL',
  },
  {
    version: '0.3.0',
    date: '2026-03-13',
    type: 'feature',
    description: 'Add syntax highlighting to code blocks with a language selector dropdown (33 languages + auto-detect)',
  },
  {
    version: '0.2.0',
    date: '2026-03-12',
    type: 'feature',
    description: 'Add clickable version display in footer with release notes dialog',
  },
  {
    version: '0.2.0',
    date: '2026-03-12',
    type: 'feature',
    description: 'Save status indicator in the note metadata bar',
  },
  {
    version: '0.2.0',
    date: '2026-03-12',
    type: 'feature',
    description: 'Account closure with 7-day grace period and email notifications',
  },
  {
    version: '0.2.0',
    date: '2026-03-12',
    type: 'feature',
    description: 'Reorganize settings dialog into General and Account tabs',
  },
  {
    version: '0.2.0',
    date: '2026-03-12',
    type: 'feature',
    description: 'Find and replace within notes (Ctrl+F / Ctrl+H)',
  },
  {
    version: '0.2.0',
    date: '2026-03-11',
    type: 'feature',
    description: 'Note-to-note linking via /note-link slash command or toolbar',
  },
  {
    version: '0.2.0',
    date: '2026-03-11',
    type: 'feature',
    description: 'Progressive web app (PWA) support with install prompt',
  },
  {
    version: '0.2.0',
    date: '2026-03-11',
    type: 'feature',
    description: 'Improved responsiveness for smaller viewports (<= 1024px)',
  },
  {
    version: '0.2.0',
    date: '2026-03-10',
    type: 'feature',
    description: 'Global font size setting with four levels (default, large, XL, XXL)',
  },
  {
    version: '0.2.0',
    date: '2026-03-10',
    type: 'feature',
    description: 'Text color picker in toolbar and bubble menu',
  },
  {
    version: '0.2.0',
    date: '2026-03-10',
    type: 'feature',
    description: 'Drag handles for block-level content reordering in the editor',
  },
  {
    version: '0.2.0',
    date: '2026-03-10',
    type: 'feature',
    description: 'Toggleable smart typography (curly quotes, em dashes, etc.)',
  },
  {
    version: '0.2.0',
    date: '2026-03-10',
    type: 'feature',
    description: 'Quick Note button for low-friction note creation with mini rich-text editor',
  },
  {
    version: '0.2.0',
    date: '2026-03-10',
    type: 'feature',
    description: 'Note metadata bar showing word count, reading time, and dates',
  },
  {
    version: '0.2.0',
    date: '2026-03-09',
    type: 'feature',
    description: 'Print note feature',
  },
  {
    version: '0.2.0',
    date: '2026-03-09',
    type: 'feature',
    description: 'Image upload and resizing with drag handles',
  },
  {
    version: '0.2.0',
    date: '2026-03-08',
    type: 'feature',
    description: 'Note templates with built-in and custom user templates',
  },
  {
    version: '0.2.0',
    date: '2026-03-08',
    type: 'feature',
    description: 'Text highlight with multicolor picker',
  },
  {
    version: '0.2.0',
    date: '2026-03-08',
    type: 'feature',
    description: 'Data export as JSON or Markdown ZIP',
  },
  {
    version: '0.2.0',
    date: '2026-03-07',
    type: 'feature',
    description: 'Password-protect individual notes',
  },
  {
    version: '0.2.0',
    date: '2026-03-06',
    type: 'feature',
    description: 'Move sections to another notebook',
  },
  {
    version: '0.1.0',
    date: '2026-03-01',
    type: 'feature',
    description: 'Initial release with notebooks, sections, notes, rich text editor, tags, search, sharing, favorites, archive, templates, and account management',
  },
];
