import { Component, inject, signal, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faBoxOpen, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { NoteService } from '../../../core/services/note.service';
import { UnarchiveDialog } from './unarchive-dialog';
import type { ArchivedNoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-archive-panel',
  imports: [FaIconComponent, UnarchiveDialog],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Archive</span>
      </div>

      <!-- List -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            Loading…
          </div>
        } @else if (notes().length === 0) {
          <p class="py-8 text-center text-sm text-gray-400">No archived notes</p>
        } @else {
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (note of notes(); track note.id) {
              <li class="px-3 py-2.5">
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
                      Archived {{ formatDate(note.archivedAt) }}
                    </p>
                  </div>
                  <button
                    (click)="startRestore(note)"
                    class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Restore note"
                  >
                    <fa-icon [icon]="faBoxOpen" size="sm" />
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>

    <!-- Unarchive dialog -->
    @if (restoringNote()) {
      <app-unarchive-dialog
        (restored)="onRestored($event)"
        (cancelled)="restoringNote.set(null)"
      />
    }
  `,
})
export class ArchivePanel implements OnInit {
  private noteSvc = inject(NoteService);

  protected faStickyNote = faStickyNote;
  protected faBoxOpen = faBoxOpen;
  protected faSpinner = faSpinner;

  protected notes = signal<ArchivedNoteDto[]>([]);
  protected loading = signal(false);
  protected restoringNote = signal<ArchivedNoteDto | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.noteSvc.getArchived().subscribe({
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

  protected startRestore(note: ArchivedNoteDto): void {
    this.restoringNote.set(note);
  }

  protected onRestored(sectionId: number): void {
    const note = this.restoringNote();
    if (!note) return;
    this.noteSvc.unarchive(note.id, sectionId).subscribe(() => {
      this.notes.update((list) => list.filter((n) => n.id !== note.id));
      this.restoringNote.set(null);
    });
  }
}
