import { Component, input, output, signal, computed, ElementRef, viewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faMagnifyingGlass, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { APP_VERSION } from '../../../version';

interface HelpSection {
  id: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-help-panel',
  imports: [FaIconComponent, FormsModule],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    @if (!asContent()) {
      <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Help</span>
        <button
          (click)="close.emit()"
          class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Close help"
        >
          <fa-icon [icon]="faXmark" size="sm" />
        </button>
      </div>
    }

    <div #scrollContainer class="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
      <!-- Search -->
      <div class="relative mb-3">
        <fa-icon [icon]="faMagnifyingGlass" class="pointer-events-none absolute left-2.5 top-2 text-gray-400" size="xs" />
        <input
          type="text"
          placeholder="Search help..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
        />
      </div>

      <!-- Table of Contents -->
      @if (!searchQuery()) {
        <nav class="mb-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Contents</p>
          <ul class="columns-2 gap-x-3 text-xs">
            @for (s of sections; track s.id) {
              <li class="mb-0.5 break-inside-avoid">
                <a
                  (click)="scrollTo(s.id); $event.preventDefault()"
                  href="#"
                  class="text-accent-600 hover:text-accent-700 hover:underline dark:text-accent-400 dark:hover:text-accent-300"
                >{{ s.title }}</a>
              </li>
            }
          </ul>
        </nav>
      }

      <!-- Sections -->
      @for (s of filteredSections(); track s.id) {
        <section class="mb-5" [id]="'help-' + s.id" #sectionEl>
          <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">{{ s.title }}</h3>
          <div [innerHTML]="s.content"></div>
          <button
            (click)="scrollToTop()"
            class="mt-1.5 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-accent-500 dark:hover:text-accent-400"
          >
            <fa-icon [icon]="faChevronUp" size="xs" />
            Back to top
          </button>
        </section>
      }

      @if (filteredSections().length === 0 && searchQuery()) {
        <p class="py-4 text-center text-gray-400">No results for "{{ searchQuery() }}"</p>
      }

      <hr class="my-4 border-gray-200 dark:border-gray-700" />
      <p class="text-xs text-gray-400 dark:text-gray-500">NoteFlow <button (click)="releaseNotes.emit()" class="underline hover:text-gray-600 dark:hover:text-gray-300">v{{ appVersion }}</button></p>
    </div>
  `,
})
export class HelpPanel {
  asContent = input(false);
  close = output();
  releaseNotes = output();

  protected faXmark = faXmark;
  protected faMagnifyingGlass = faMagnifyingGlass;
  protected faChevronUp = faChevronUp;
  protected appVersion = APP_VERSION;

  protected searchQuery = signal('');

  private scrollContainerRef = viewChildren<ElementRef>('scrollContainer');

  protected readonly sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: `
        <p class="mb-1">NoteFlow organises your notes into a collapsible tree view:</p>
        <ol class="ml-4 list-decimal space-y-0.5">
          <li>Create a <strong>Notebook</strong> using the + button at the top of the tree</li>
          <li>Expand a notebook and add <strong>Sections</strong> using the + icon on hover</li>
          <li>Expand a section and create <strong>Notes</strong> the same way</li>
          <li>Click any note in the tree to open it in the editor</li>
        </ol>`,
    },
    {
      id: 'tree-view',
      title: 'Tree View',
      content: `
        <p class="mb-1">The tree panel shows your full notebook hierarchy:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click <strong>+</strong> / <strong>&minus;</strong> to expand or collapse notebooks and sections</li>
          <li>Hover over any item to see action buttons: add child, rename, or delete</li>
          <li>Connector lines show the parent-child structure</li>
          <li>Collapse the entire tree panel with the chevron in its header</li>
          <li>Use the expand icon in the editor to enter full-screen mode</li>
        </ul>`,
    },
    {
      id: 'favorites',
      title: 'Favorites',
      content: `
        <p class="mb-1">Mark notes as favorites for quick access:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the star icon in the editor toolbar to favorite or unfavorite a note</li>
          <li>Open the Favorites view from the star icon in the navigation rail</li>
          <li>Click a favorited note to navigate directly to it</li>
        </ul>`,
    },
    {
      id: 'search',
      title: 'Search',
      content: `<p>Click the magnifying-glass icon in the navigation rail to search across all of your notebooks, sections, and notes. Results show the note title, its location, and a text snippet. Click a result to open it in the editor.</p>`,
    },
    {
      id: 'slash-commands',
      title: 'Slash Commands',
      content: `
        <p class="mb-1">Type <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/</kbd> on a new line in the editor to open the command menu. Available commands:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>Heading 1&ndash;3</strong> &mdash; section headings</li>
          <li><strong>Bullet List</strong> &mdash; unordered list</li>
          <li><strong>Numbered List</strong> &mdash; ordered list</li>
          <li><strong>Todo List</strong> &mdash; checklist with toggleable items</li>
          <li><strong>Quote</strong> &mdash; blockquote</li>
          <li><strong>Code Block</strong> &mdash; syntax-highlighted code with language selector</li>
          <li><strong>Divider</strong> &mdash; horizontal rule</li>
          <li><strong>Table</strong> &mdash; insert a 3&times;3 table</li>
          <li><strong>Image</strong> &mdash; upload an image</li>
          <li><strong>Audio</strong> &mdash; upload an audio clip</li>
          <li><strong>Link to Note</strong> &mdash; link to another note in your notebooks</li>
          <li><strong>YouTube</strong> &mdash; embed a YouTube video</li>
          <li><strong>Math Equation</strong> &mdash; insert a LaTeX math expression</li>
        </ul>`,
    },
    {
      id: 'text-formatting',
      title: 'Text Formatting',
      content: `
        <p class="mb-1">Toggle the formatting toolbar using the toolbar button in the editor header for quick access to text styles, formatting, lists, and block types &mdash; including undo and redo. You can also select text to see a contextual bubble menu with inline formatting options.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>Text color</strong> &mdash; pick from a palette of colours in the toolbar or bubble menu</li>
          <li><strong>Highlight</strong> &mdash; multicolour text highlight</li>
          <li><strong>Smart typography</strong> &mdash; auto-converts straight quotes to curly quotes, hyphens to em dashes, etc. Toggle on/off in Settings</li>
          <li><strong>Clear formatting</strong> &mdash; select text and click the clear formatting button to strip all styles (bold, italic, colour, etc.) back to plain text</li>
        </ul>`,
    },
    {
      id: 'font-display',
      title: 'Font & Display',
      content: `
        <p class="mb-1">Customise the editor appearance:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Switch between <strong>serif and sans-serif</strong> fonts in the editor toolbar</li>
          <li>Choose a <strong>font size</strong> (default, large, XL, XXL) in Settings &gt; General</li>
        </ul>`,
    },
    {
      id: 'code-blocks',
      title: 'Code Blocks',
      content: `
        <p class="mb-1">Insert a code block via the toolbar, <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/code</kbd> slash command, or by typing <code>\`\`\`</code> at the start of a line.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Syntax highlighting for 33+ languages</li>
          <li>Use the dropdown in the top-right corner to pick a language, or leave it on <strong>Auto-detect</strong></li>
        </ul>`,
    },
    {
      id: 'youtube',
      title: 'YouTube Videos',
      content: `
        <p class="mb-1">Embed YouTube videos in your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the YouTube icon in the toolbar and paste a URL</li>
          <li>Use the <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/youtube</kbd> slash command</li>
          <li>Or simply paste a YouTube link &mdash; it auto-embeds</li>
        </ul>`,
    },
    {
      id: 'audio',
      title: 'Audio',
      content: `
        <p class="mb-1">Add audio clips to your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Upload via the toolbar button, <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/audio</kbd> slash command, or drag-and-drop / paste</li>
          <li>Supported formats: MP3, WAV, OGG, WebM, M4A (up to 25 MB)</li>
          <li>Audio plays inline with native browser controls</li>
        </ul>`,
    },
    {
      id: 'math',
      title: 'Math Equations',
      content: `
        <p class="mb-1">Insert LaTeX math expressions into your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Toolbar button (√x icon), <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/math</kbd> slash command, or type <code>$...$</code> delimiters</li>
          <li>Click a rendered equation to edit the raw LaTeX source</li>
          <li>Examples: <code>$x^2$</code>, <code>$\\frac{a}{b}$</code>, <code>$\\sum_{i=1}^n i$</code></li>
          <li>Rendered with KaTeX &mdash; works in both light and dark mode</li>
        </ul>`,
    },
    {
      id: 'images',
      title: 'Images',
      content: `
        <p class="mb-1">Add images to your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Upload via the toolbar button, <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/image</kbd> slash command, or drag-and-drop / paste</li>
          <li>Resize images using the corner drag handles</li>
        </ul>`,
    },
    {
      id: 'note-links',
      title: 'Note Links',
      content: `<p>Link to other notes within your notebooks using the <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/note-link</kbd> slash command or the link toolbar. Click a note link to navigate directly to it.</p>`,
    },
    {
      id: 'find-replace',
      title: 'Find & Replace',
      content: `<p>Press <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+F</kbd> to find text within the current note, or <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+H</kbd> to open find and replace. Matches are highlighted as you type. Toggle case sensitivity with the Aa button.</p>`,
    },
    {
      id: 'quick-note',
      title: 'Quick Note',
      content: `<p>Click the Quick Note button in the header to create a note without leaving your current view. Pick a notebook and section, give it a title, and optionally add formatted content with the mini editor.</p>
<p>Need a new notebook or section? Click the <strong>+ New</strong> link next to either dropdown to create one inline — no need to leave the dialog. When you create a new notebook, the section creation input opens automatically so you can set up both in one step.</p>`,
    },
    {
      id: 'metadata',
      title: 'Note Metadata',
      content: `<p>The metadata bar below the note title shows word count, estimated reading time, creation date, and last updated time. Toggle metadata visibility in Settings &gt; General &gt; Editor.</p>
        <p class="mt-1">Use the <strong>save button</strong> (floppy disk icon) in the note toolbar to manually save at any time. The icon turns to a green checkmark when saved successfully. Notes also auto-save automatically after you stop typing.</p>`,
    },
    {
      id: 'sharing',
      title: 'Sharing',
      content: `
        <p class="mb-1">Share notes with a public link anyone can view:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the share icon in the editor toolbar to create a public link</li>
          <li>Copy the link to share it with others</li>
          <li>Open the Shared view from the navigation rail to see all shared notes</li>
          <li>Stop sharing at any time to revoke access</li>
        </ul>`,
    },
    {
      id: 'tags',
      title: 'Tags',
      content: `
        <p class="mb-1">Organise notes with tags for easy browsing:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the tag icon in the editor toolbar to add or remove tags</li>
          <li>Type a tag name and press Enter &mdash; existing tags are suggested as you type</li>
          <li>Open the Tags view from the navigation rail to browse all tags</li>
          <li>Click a tag to see all notes with that tag, then click a note to open it</li>
          <li>Rename or delete tags from the tags panel</li>
        </ul>`,
    },
    {
      id: 'templates',
      title: 'Templates',
      content: `
        <p class="mb-1">Start new notes from templates:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Choose a built-in template when creating a note (meeting notes, standup status, etc.)</li>
          <li>Save any note as a <strong>custom template</strong> for reuse</li>
          <li>Apply a template to an empty note, or rename and delete custom templates</li>
        </ul>`,
    },
    {
      id: 'move-duplicate',
      title: 'Move & Duplicate',
      content: `
        <p class="mb-1">Use the editor toolbar to move or duplicate notes and sections:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Move a note to any notebook and section</li>
          <li>Move a section to another notebook</li>
          <li>Duplicate a note within the same section</li>
        </ul>`,
    },
    {
      id: 'password-protection',
      title: 'Password Protection',
      content: `<p>Lock individual notes with a password. Protected notes show a lock icon in the tree and require the password to view or edit. Remove the lock at any time from the editor toolbar.</p>`,
    },
    {
      id: 'archive',
      title: 'Archive',
      content: `
        <p class="mb-1">Archive notes you no longer need instead of deleting them. Archived notes are hidden from normal views but can be restored at any time.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the archive icon in the editor toolbar to archive a note</li>
          <li>Open the archive panel from the bottom of the navigation rail</li>
          <li>Restore a note by choosing a destination notebook and section</li>
          <li>Toggle "Include archived notes" in search to find archived content</li>
        </ul>`,
    },
    {
      id: 'recycle-bin',
      title: 'Recycle Bin',
      content: `
        <p class="mb-1">When you delete a notebook, section, or note, it moves to the Recycle Bin instead of being permanently removed.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Open the Recycle Bin from the trash icon at the bottom of the navigation rail</li>
          <li>Deleted items are kept for <strong>30 days</strong> before automatic permanent deletion</li>
          <li>Restore any item to put it back where it was &mdash; notes can be restored to a different section if the original was deleted</li>
          <li>Permanently delete individual items, or use <strong>Empty Bin</strong> to clear everything</li>
          <li>A toast notification with an <strong>Undo</strong> button appears after every delete</li>
          <li>Enable <strong>"Delete items immediately"</strong> in Settings &gt; General &gt; Storage to bypass the Recycle Bin entirely</li>
        </ul>`,
    },
    {
      id: 'import-export',
      title: 'Import & Export',
      content: `
        <p class="mb-1">Move content in and out of NoteFlow:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Export a single note as Markdown, HTML, styled HTML, or PDF using the download icon in the editor toolbar</li>
          <li>Import a Markdown file into the current section using the import icon</li>
          <li>Export all your data as a JSON or Markdown ZIP from Settings &gt; Account &gt; Export My Data</li>
        </ul>`,
    },
    {
      id: 'print',
      title: 'Print',
      content: `<p>Print the current note using the print icon in the editor toolbar. The print layout strips the UI and formats the note content for clean output.</p>`,
    },
    {
      id: 'presentation',
      title: 'Presentation Mode',
      content: `<p>Click the monitor icon in the editor toolbar to present your note in a full-screen overlay with larger text. Press Escape or click the close button to exit.</p>`,
    },
    {
      id: 'appearance',
      title: 'Appearance & Themes',
      content: `
        <p class="mb-1">Customise how NoteFlow looks:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Toggle <strong>dark mode</strong> using the sun/moon icon in the top-right corner, or in Settings &gt; Appearance</li>
          <li>Choose from <strong>12 color themes</strong> in Settings &gt; General &gt; Appearance: Default, Nord, Solarized, Dracula, Catppuccin, Ros&eacute; Pine, Tokyo Night, Gruvbox, Everforest, One Dark, Moonlight, and Kanagawa</li>
          <li>Each theme customises the full UI palette &mdash; backgrounds, borders, text, and accent colors</li>
          <li>Themes and dark/light mode combine for <strong>24 visual variations</strong></li>
          <li>Your preferences are saved to your account and persist across devices</li>
        </ul>`,
    },
    {
      id: 'drag-drop',
      title: 'Drag & Drop',
      content: `
        <p class="mb-1">Reorder and rearrange content by dragging:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Drag notebooks, sections, and notes to reorder them in their panels</li>
          <li>Drag blocks within the editor using the handle that appears on hover</li>
        </ul>`,
    },
    {
      id: 'pwa',
      title: 'Install as App (PWA)',
      content: `<p>NoteFlow can be installed as a standalone app on your device for quick access and a native app experience. Look for the install prompt in the header or Settings, or use your browser's "Install app" option. Once installed, NoteFlow opens in its own window.</p>`,
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro Timer',
      content: `
        <p class="mb-1">A built-in focus timer using the Pomodoro Technique. Toggle it from the hourglass icon in the header.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>Work sessions</strong> &mdash; 25 minutes of focused work</li>
          <li><strong>Short breaks</strong> &mdash; 5 minutes after each work session</li>
          <li><strong>Long breaks</strong> &mdash; 15 minutes after every 4 work sessions</li>
          <li>Start, pause, reset, or skip to the next session with the control buttons</li>
          <li>Collapse the widget to a compact pill showing just the countdown</li>
          <li>An audio chime plays when each session ends</li>
        </ul>`,
    },
    {
      id: 'settings-general',
      title: 'Settings: General',
      content: `
        <p class="mb-1">Access Settings from the gear icon in the navigation rail. The General tab includes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>Appearance</strong> &mdash; light/dark mode toggle and color theme picker (12 themes)</li>
          <li><strong>Storage</strong> &mdash; toggle "Delete items immediately" to bypass the Recycle Bin and permanently delete right away (off by default; items normally go to the Recycle Bin for 30 days)</li>
          <li><strong>Editor: Show Formatting Toolbar</strong> &mdash; toggle the rich text toolbar above the editor</li>
          <li><strong>Editor: Serif Font</strong> &mdash; switch the editor between sans-serif and serif typefaces</li>
          <li><strong>Editor: Show Note Metadata</strong> &mdash; toggle the word count, reading time, and timestamps bar</li>
          <li><strong>Editor: Smart Typography</strong> &mdash; auto-convert characters like -> to arrows, (c) to &copy;, straight quotes to curly quotes, and -- to em dashes</li>
          <li><strong>Editor: Font Size</strong> &mdash; choose from Default, Large, Extra Large, or Extra Extra Large</li>
        </ul>`,
    },
    {
      id: 'settings-account',
      title: 'Settings: Account',
      content: `
        <p class="mb-1">The Account tab in Settings covers:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>Change Password</strong> &mdash; enter your current password and set a new one (minimum 8 characters)</li>
          <li><strong>Export My Data</strong> &mdash; download all your notebooks, sections, notes, and tags as <strong>JSON</strong> (machine-readable) or <strong>Markdown ZIP</strong> (human-readable, one file per note). We recommend exporting before closing your account</li>
          <li><strong>Close My Account</strong> &mdash; permanently delete your account and all data. There is a <strong>7-day grace period</strong> during which you can log in and cancel the closure. After 7 days, all data is irreversibly deleted</li>
          <li><strong>Reactivate</strong> &mdash; if you've requested account closure, a reactivation button appears so you can cancel it within the grace period</li>
          <li><strong>Sign Out</strong> &mdash; log out of NoteFlow on this device</li>
        </ul>`,
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      content: `
        <p class="mb-1">Useful keyboard shortcuts in the editor:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+B</kbd> Bold</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+I</kbd> Italic</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+U</kbd> Underline</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+K</kbd> Insert link</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+Z</kbd> / <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+Shift+Z</kbd> Undo / Redo</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+F</kbd> Find in note</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+H</kbd> Find &amp; Replace</li>
          <li><kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Tab</kbd> / <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Shift+Tab</kbd> Indent / outdent list items</li>
        </ul>`,
    },
  ];

  protected filteredSections = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.sections;
    return this.sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  });

  protected scrollTo(id: string): void {
    const el = document.getElementById('help-' + id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected scrollToTop(): void {
    const containers = this.scrollContainerRef();
    if (containers.length > 0) {
      containers[0].nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
