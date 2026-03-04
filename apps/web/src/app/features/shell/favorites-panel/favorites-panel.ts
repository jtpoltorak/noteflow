import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faStar, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { NoteService } from '../../../core/services/note.service';
import type { FavoriteNoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-favorites-panel',
  imports: [FaIconComponent],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Favorites</span>
      </div>

      <!-- List -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            Loading…
          </div>
        } @else if (notes().length === 0) {
          <p class="py-8 text-center text-sm text-gray-400 px-4">No favorited notes yet. Star a note from the editor to see it here.</p>
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
                      Favorited {{ formatDate(note.favoritedAt) }}
                    </p>
                  </div>
                  <button
                    (click)="onUnfavorite($event, note)"
                    class="shrink-0 rounded p-1 text-yellow-400 hover:bg-gray-200 hover:text-yellow-500 dark:hover:bg-gray-700"
                    title="Remove from favorites"
                  >
                    <fa-icon [icon]="faStar" size="sm" />
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
export class FavoritesPanel implements OnInit {
  private noteSvc = inject(NoteService);

  resultClicked = output<{ notebookId: number; sectionId: number; noteId: number }>();

  protected faStickyNote = faStickyNote;
  protected faStar = faStar;
  protected faSpinner = faSpinner;

  protected notes = signal<FavoriteNoteDto[]>([]);
  protected loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.noteSvc.getFavorites().subscribe({
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

  protected onNoteClicked(note: FavoriteNoteDto): void {
    this.resultClicked.emit({ notebookId: note.notebookId, sectionId: note.sectionId, noteId: note.id });
  }

  protected onUnfavorite(event: Event, note: FavoriteNoteDto): void {
    event.stopPropagation();
    this.noteSvc.unfavorite(note.id).subscribe(() => {
      this.notes.update((list) => list.filter((n) => n.id !== note.id));
    });
  }
}
