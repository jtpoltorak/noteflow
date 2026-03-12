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
        <p class="mb-1">NoteFlow organises your notes into a three-level hierarchy:</p>
        <ol class="ml-4 list-decimal space-y-0.5">
          <li>Create a <strong>Notebook</strong> in the left panel</li>
          <li>Add <strong>Sections</strong> to group related notes</li>
          <li>Write <strong>Notes</strong> inside each section</li>
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
          <li><strong>Code Block</strong> &mdash; preformatted code</li>
          <li><strong>Divider</strong> &mdash; horizontal rule</li>
        </ul>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Text Formatting</h3>
        <p>Toggle the formatting toolbar using the toolbar button in the editor header for quick access to text styles, formatting, lists, and block types &mdash; including undo and redo. You can also select text to see a contextual bubble menu with inline formatting options.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Font Style</h3>
        <p>Switch between serif and sans-serif fonts using the font toggle button in the editor toolbar. Your choice applies to the current editing session.</p>
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
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Move &amp; Duplicate</h3>
        <p>Use the editor toolbar to move a note to a different section or duplicate it. The move dialog lets you pick any notebook and section as the destination.</p>
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
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Import &amp; Export</h3>
        <p>Export any note as a Markdown file using the download icon in the editor toolbar. Import a Markdown file into the current section using the import icon in the notes list header.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Presentation Mode</h3>
        <p>Click the monitor icon in the editor toolbar to present your note in a full-screen overlay. Press Escape or click the close button to exit.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Panels</h3>
        <p>Each panel can be collapsed using the chevron icon in its header. Click the arrow on the collapsed strip to expand it again. Use the expand icon to enter full-screen editor mode.</p>
      </section>

      <section class="mb-5">
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Dark Mode</h3>
        <p>Toggle dark mode using the sun/moon icon in the top-right corner of the header bar. Your preference is saved and persists across sessions.</p>
      </section>

      <section>
        <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-gray-100">Drag &amp; Drop</h3>
        <p>Reorder notebooks, sections, and notes by dragging them to a new position in their respective panels.</p>
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
