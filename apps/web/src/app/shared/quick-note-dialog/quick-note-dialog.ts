import { Component, inject, input, output, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../modal/modal';
import { SectionService } from '../../core/services/section.service';
import { NoteService } from '../../core/services/note.service';
import { ShellStateService } from '../../features/shell/shell-state.service';
import type { NotebookDto, SectionDto } from '@noteflow/shared-types';

export interface QuickNoteResult {
  notebookId: number;
  sectionId: number;
  noteId: number;
}

@Component({
  selector: 'app-quick-note-dialog',
  imports: [Modal, FormsModule],
  template: `
    <app-modal [open]="open()" title="Quick Note" (closed)="closed.emit()">
      <div class="flex flex-col gap-4">
        <!-- Title -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            #titleInput
            type="text"
            [(ngModel)]="title"
            maxlength="75"
            placeholder="Note title"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            (keydown.enter)="create()"
          />
        </div>

        <!-- Notebook -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notebook</label>
          <select
            [(ngModel)]="selectedNotebookId"
            (ngModelChange)="onNotebookChange($event)"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            @for (nb of notebooks(); track nb.id) {
              <option [value]="nb.id">{{ nb.title }}</option>
            }
          </select>
        </div>

        <!-- Section -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
          <select
            [(ngModel)]="selectedSectionId"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            [disabled]="sections().length === 0"
          >
            @for (sec of sections(); track sec.id) {
              <option [value]="sec.id">{{ sec.title }}</option>
            }
            @if (sections().length === 0) {
              <option value="" disabled>No sections in this notebook</option>
            }
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-1">
          <button
            (click)="closed.emit()"
            class="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            (click)="create()"
            [disabled]="!canCreate()"
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class QuickNoteDialog {
  open = input(false);
  closed = output();
  created = output<QuickNoteResult>();

  private sectionSvc = inject(SectionService);
  private noteSvc = inject(NoteService);
  private state = inject(ShellStateService);

  protected notebooks = this.state.notebooks;
  protected sections = signal<SectionDto[]>([]);

  protected title = '';
  protected selectedNotebookId: number | '' = '';
  protected selectedSectionId: number | '' = '';

  constructor() {
    // When dialog opens, set defaults
    effect(() => {
      if (!this.open()) return;

      this.title = '';

      const nbs = this.notebooks();
      if (nbs.length === 0) return;

      // Default to currently selected notebook, or first
      const currentNbId = this.state.selectedNotebookId();
      const defaultNbId = currentNbId && nbs.some((n) => n.id === currentNbId) ? currentNbId : nbs[0].id;
      this.selectedNotebookId = defaultNbId;
      this.loadSections(defaultNbId);

      // Auto-focus title input after render
      requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>('app-quick-note-dialog input[type="text"]')?.focus();
      });
    });
  }

  protected canCreate(): boolean {
    return !!this.title.trim() && !!this.selectedSectionId;
  }

  protected onNotebookChange(notebookId: number): void {
    this.selectedSectionId = '';
    this.sections.set([]);
    this.loadSections(notebookId);
  }

  protected create(): void {
    if (!this.canCreate()) return;

    const sectionId = Number(this.selectedSectionId);
    const notebookId = Number(this.selectedNotebookId);
    const title = this.title.trim();

    this.noteSvc.create(sectionId, title).subscribe((note) => {
      this.created.emit({ notebookId, sectionId, noteId: note.id });
      this.closed.emit();
    });
  }

  private loadSections(notebookId: number): void {
    this.sectionSvc.getByNotebook(notebookId).subscribe((sections) => {
      this.sections.set(sections);
      // Default to currently selected section if it's in this notebook, or first
      const currentSecId = this.state.selectedSectionId();
      if (currentSecId && sections.some((s) => s.id === currentSecId)) {
        this.selectedSectionId = currentSecId;
      } else if (sections.length > 0) {
        this.selectedSectionId = sections[0].id;
      }
    });
  }
}
