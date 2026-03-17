import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faShareNodes, faCopy, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { NoteService } from '../../../core/services/note.service';
import type { SharedNoteListDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-shared-panel',
  imports: [FaIconComponent],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Shared</span>
      </div>

      <!-- List -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            Loading…
          </div>
        } @else if (notes().length === 0) {
          <p class="px-4 py-8 text-center text-sm text-gray-400">No shared notes yet. Share a note from the editor toolbar to see it here.</p>
        } @else {
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (note of notes(); track note.id) {
              <li
                class="cursor-pointer px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                (click)="onNoteClicked(note)"
              >
                <div class="flex items-start gap-2">
                  <fa-icon [icon]="faStickyNote" class="mt-0.5 shrink-0 text-gray-400" size="sm" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="note.title">
                      {{ note.title }}
                    </p>
                    <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                      {{ note.notebookTitle }} &rsaquo; {{ note.sectionTitle }}
                    </p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">
                      Updated {{ formatDate(note.updatedAt) }}
                    </p>
                  </div>
                  <button
                    (click)="copyLink($event, note)"
                    class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    [title]="copiedId() === note.id ? 'Copied!' : 'Copy share link'"
                  >
                    <fa-icon [icon]="copiedId() === note.id ? faShareNodes : faCopy" size="sm" [class]="copiedId() === note.id ? 'text-accent-500' : ''" />
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class SharedPanel implements OnInit {
  private noteSvc = inject(NoteService);

  resultClicked = output<{ notebookId: number; sectionId: number; noteId: number }>();

  protected faStickyNote = faStickyNote;
  protected faShareNodes = faShareNodes;
  protected faCopy = faCopy;
  protected faSpinner = faSpinner;

  protected notes = signal<SharedNoteListDto[]>([]);
  protected loading = signal(false);
  protected copiedId = signal<number | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.noteSvc.getShared().subscribe({
      next: (list) => {
        this.notes.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected onNoteClicked(note: SharedNoteListDto): void {
    this.resultClicked.emit({ notebookId: note.notebookId, sectionId: note.sectionId, noteId: note.id });
  }

  protected async copyLink(event: Event, note: SharedNoteListDto): Promise<void> {
    event.stopPropagation();
    const url = `${window.location.origin}/shared/${note.shareToken}`;
    await navigator.clipboard.writeText(url);
    this.copiedId.set(note.id);
    setTimeout(() => this.copiedId.set(null), 2000);
  }
}
