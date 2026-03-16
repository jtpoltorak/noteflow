import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { APP_VERSION } from '../../../version';

@Component({
  selector: 'app-help-panel',
  imports: [FaIconComponent],
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

    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Getting Started</h3>
        <p class="mb-1">NoteFlow organises your notes into a collapsible tree view:</p>
        <ol class="ml-4 list-decimal space-y-0.5">
          <li>Create a <strong>Notebook</strong> using the + button at the top of the tree</li>
          <li>Expand a notebook and add <strong>Sections</strong> using the + icon on hover</li>
          <li>Expand a section and create <strong>Notes</strong> the same way</li>
          <li>Click any note in the tree to open it in the editor</li>
        </ol>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Favorites</h3>
        <p class="mb-1">Mark notes as favorites for quick access:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the star icon in the editor toolbar to favorite or unfavorite a note</li>
          <li>Open the Favorites view from the star icon in the navigation rail</li>
          <li>Click a favorited note to navigate directly to it</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Search</h3>
        <p>Click the magnifying-glass icon in the navigation rail to search across all of your notebooks, sections, and notes. Results show the note title, its location, and a text snippet. Click a result to open it in the editor.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Slash Commands</h3>
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
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Text Formatting</h3>
        <p class="mb-1">Toggle the formatting toolbar using the toolbar button in the editor header for quick access to text styles, formatting, lists, and block types &mdash; including undo and redo. You can also select text to see a contextual bubble menu with inline formatting options.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>Text color</strong> &mdash; pick from a palette of colours in the toolbar or bubble menu</li>
          <li><strong>Highlight</strong> &mdash; multicolour text highlight</li>
          <li><strong>Smart typography</strong> &mdash; auto-converts straight quotes to curly quotes, hyphens to em dashes, etc. Toggle on/off in Settings</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Font &amp; Display</h3>
        <p class="mb-1">Customise the editor appearance:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Switch between <strong>serif and sans-serif</strong> fonts in the editor toolbar</li>
          <li>Choose a <strong>font size</strong> (default, large, XL, XXL) in Settings &gt; General</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Code Blocks</h3>
        <p class="mb-1">Insert a code block via the toolbar, <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/code</kbd> slash command, or by typing <code>\`\`\`</code> at the start of a line.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Syntax highlighting for 33+ languages</li>
          <li>Use the dropdown in the top-right corner to pick a language, or leave it on <strong>Auto-detect</strong></li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">YouTube Videos</h3>
        <p class="mb-1">Embed YouTube videos in your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the YouTube icon in the toolbar and paste a URL</li>
          <li>Use the <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/youtube</kbd> slash command</li>
          <li>Or simply paste a YouTube link &mdash; it auto-embeds</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Audio</h3>
        <p class="mb-1">Add audio clips to your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Upload via the toolbar button, <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/audio</kbd> slash command, or drag-and-drop / paste</li>
          <li>Supported formats: MP3, WAV, OGG, WebM, M4A (up to 25 MB)</li>
          <li>Audio plays inline with native browser controls</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Images</h3>
        <p class="mb-1">Add images to your notes:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Upload via the toolbar button, <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/image</kbd> slash command, or drag-and-drop / paste</li>
          <li>Resize images using the corner drag handles</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Note Links</h3>
        <p>Link to other notes within your notebooks using the <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">/note-link</kbd> slash command or the link toolbar. Click a note link to navigate directly to it.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Find &amp; Replace</h3>
        <p>Press <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+F</kbd> to find text within the current note, or <kbd class="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700">Ctrl+H</kbd> to open find and replace. Matches are highlighted as you type.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Quick Note</h3>
        <p>Click the Quick Note button in the header to create a note without leaving your current view. Pick a notebook and section, give it a title, and optionally add formatted content with the mini editor.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Note Metadata</h3>
        <p>The metadata bar below the note title shows word count, estimated reading time, creation date, and last updated time. A save indicator appears when changes are being saved.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Sharing</h3>
        <p class="mb-1">Share notes with a public link anyone can view:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the share icon in the editor toolbar to create a public link</li>
          <li>Copy the link to share it with others</li>
          <li>Open the Shared view from the navigation rail to see all shared notes</li>
          <li>Stop sharing at any time to revoke access</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Tags</h3>
        <p class="mb-1">Organise notes with tags for easy browsing:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the tag icon in the editor toolbar to add or remove tags</li>
          <li>Type a tag name and press Enter &mdash; existing tags are suggested as you type</li>
          <li>Open the Tags view from the navigation rail to browse all tags</li>
          <li>Click a tag to see all notes with that tag, then click a note to open it</li>
          <li>Rename or delete tags from the tags panel</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Templates</h3>
        <p class="mb-1">Start new notes from templates:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Choose a built-in template when creating a note (meeting notes, standup status, etc.)</li>
          <li>Save any note as a <strong>custom template</strong> for reuse</li>
          <li>Apply a template to an empty note, or rename and delete custom templates</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Move &amp; Duplicate</h3>
        <p class="mb-1">Use the editor toolbar to move or duplicate notes and sections:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Move a note to any notebook and section</li>
          <li>Move a section to another notebook</li>
          <li>Duplicate a note within the same section</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Password Protection</h3>
        <p>Lock individual notes with a password. Protected notes require the password to view or edit. Remove the lock at any time from the editor toolbar.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Archive</h3>
        <p class="mb-1">Archive notes you no longer need instead of deleting them. Archived notes are hidden from normal views but can be restored at any time.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click the archive icon in the editor toolbar to archive a note</li>
          <li>Open the archive panel from the bottom of the navigation rail</li>
          <li>Restore a note by choosing a destination notebook and section</li>
          <li>Toggle "Include archived notes" in search to find archived content</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Recycle Bin</h3>
        <p class="mb-1">When you delete a notebook, section, or note, it moves to the Recycle Bin instead of being permanently removed.</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Open the Recycle Bin from the trash icon at the bottom of the navigation rail</li>
          <li>Deleted items are kept for <strong>30 days</strong> before automatic permanent deletion</li>
          <li>Restore any item to put it back where it was</li>
          <li>Permanently delete individual items, or empty the entire bin</li>
          <li>A toast notification with an <strong>Undo</strong> button appears after every delete</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Import &amp; Export</h3>
        <p class="mb-1">Move content in and out of NoteFlow:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Export a single note as Markdown, HTML, styled HTML, or PDF using the download icon in the editor toolbar</li>
          <li>Import a Markdown file into the current section using the import icon</li>
          <li>Export all your data as a JSON or Markdown ZIP from Settings &gt; Account</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Print</h3>
        <p>Print the current note using the print icon in the editor toolbar.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Presentation Mode</h3>
        <p>Click the monitor icon in the editor toolbar to present your note in a full-screen overlay. Press Escape or click the close button to exit.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Tree View</h3>
        <p class="mb-1">The tree panel shows your full notebook hierarchy:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Click <strong>+</strong> / <strong>&minus;</strong> to expand or collapse notebooks and sections</li>
          <li>Hover over any item to see action buttons: add child, rename, or delete</li>
          <li>Connector lines show the parent-child structure</li>
          <li>Collapse the entire tree panel with the chevron in its header</li>
          <li>Use the expand icon in the editor to enter full-screen mode</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Dark Mode</h3>
        <p>Toggle dark mode using the sun/moon icon in the top-right corner of the header bar. Your preference is saved and persists across sessions.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Drag &amp; Drop</h3>
        <p class="mb-1">Reorder and rearrange content by dragging:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li>Drag notebooks, sections, and notes to reorder them in their panels</li>
          <li>Drag blocks within the editor using the handle that appears on hover</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Install as App (PWA)</h3>
        <p>NoteFlow can be installed as a standalone app on your device. Look for the install prompt in the header, or use your browser's "Install app" option.</p>
      </section>

      <section>
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Account &amp; Settings</h3>
        <p class="mb-1">Access Settings from the gear icon in the navigation rail:</p>
        <ul class="ml-4 list-disc space-y-0.5">
          <li><strong>General</strong> &mdash; theme, font size, smart typography, toolbar preferences</li>
          <li><strong>Account</strong> &mdash; change password, export data, close account</li>
        </ul>
      </section>

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
  protected appVersion = APP_VERSION;
}
