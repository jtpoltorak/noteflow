export interface ReleaseEntry {
  version: string;
  date: string;
  type: 'feature' | 'bugfix';
  description: string;
}

export const RELEASE_NOTES: ReleaseEntry[] = [
  {
    version: '0.3.0',
    date: '2026-03-13',
    type: 'feature',
    description: 'Add syntax highlighting to code blocks with a language selector dropdown (33 languages + auto-detect)',
  },
  {
    version: '0.3.0',
    date: '2026-03-13',
    type: 'feature',
    description: 'Embed YouTube videos via toolbar button, /youtube slash command, or by pasting a URL',
  },
  {
    version: '0.2.0',
    date: '2025-03-12',
    type: 'feature',
    description: 'Add version number display in footer, about dialog, and help panel with clickable release notes',
  },
  {
    version: '0.1.0',
    date: '2025-03-01',
    type: 'feature',
    description: 'Initial release with notebooks, sections, notes, rich text editor, tags, search, sharing, favorites, archive, templates, and account management',
  },
];
