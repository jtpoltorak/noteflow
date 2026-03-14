export interface ReleaseGroup {
  version: string;
  date: string;
  items: string[];
}

export const RELEASE_NOTES: ReleaseGroup[] = [
  {
    version: '0.6.0',
    date: '2026-03-14',
    items: [
      'Export individual notes as PDF via the export dropdown in the editor toolbar',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-03-14',
    items: [
      'Export individual notes as HTML (plain or styled) via the export dropdown in the editor toolbar',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-03-13',
    items: [
      'Embed YouTube videos via toolbar button, /youtube slash command, or by pasting a URL',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-03-13',
    items: [
      'Syntax highlighting for code blocks with a language selector dropdown (33 languages + auto-detect)',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-03-12',
    items: [
      'Find and replace within notes (Ctrl+F / Ctrl+H)',
      'Note-to-note linking via /note-link slash command or toolbar',
      'Quick Note button for low-friction note creation with mini rich-text editor',
      'Note templates with built-in and custom user templates',
      'Password-protect individual notes',
      'Image upload and resizing with drag handles',
      'Text color picker in toolbar and bubble menu',
      'Text highlight with multicolor picker',
      'Drag handles for block-level content reordering in the editor',
      'Toggleable smart typography (curly quotes, em dashes, etc.)',
      'Note metadata bar with word count, reading time, and save indicator',
      'Global font size setting with four levels (default, large, XL, XXL)',
      'Progressive web app (PWA) support with install prompt',
      'Improved responsiveness for smaller viewports',
      'Data export as JSON or Markdown ZIP',
      'Print note feature',
      'Move sections to another notebook',
      'Account closure with 7-day grace period',
      'Reorganized settings dialog into General and Account tabs',
      'Clickable version display in footer with release notes dialog',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-03-01',
    items: [
      'Notebooks, sections, and notes with a three-panel layout',
      'Rich text editor with formatting toolbar and slash commands',
      'Tags, search, favorites, and archive',
      'Public link sharing for notes',
      'Import and export notes as Markdown',
      'Presentation mode',
      'Dark mode with persistent preference',
      'Drag-and-drop reordering for notebooks, sections, and notes',
      'User authentication with JWT',
    ],
  },
];
