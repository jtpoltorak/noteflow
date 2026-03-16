import { Component, inject, signal, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBook, faLayerGroup, faStickyNote, faTrashArrowUp, faTrash, faSpinner, faRecycle } from '@fortawesome/free-solid-svg-icons';
import { RecycleBinService } from '../../../core/services/recycle-bin.service';
import { ShellStateService } from '../shell-state.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { RestoreLocationDialog, type RestoreLocationResult } from '../../../shared/restore-location-dialog/restore-location-dialog';
import type { DeletedNotebookDto, DeletedSectionDto, DeletedNoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-recycle-bin-panel',
  imports: [FaIconComponent, ConfirmDialog, RestoreLocationDialog],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    <div class="flex h-full flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recycle Bin</span>
        @if (totalItems() > 0) {
          <button
            (click)="confirmingEmpty.set(true)"
            class="rounded p-1 text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Empty recycle bin"
          >
            <fa-icon [icon]="faTrash" size="sm" />
          </button>
        }
      </div>

      @if (confirmingEmpty()) {
        <div class="px-3 py-2">
          <app-confirm-dialog
            message="Permanently delete all items in the recycle bin? This cannot be undone."
            confirmLabel="Empty"
            (confirmed)="emptyBin()"
            (cancelled)="confirmingEmpty.set(false)"
          />
        </div>
      }

      <!-- List -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            Loading…
          </div>
        } @else if (totalItems() === 0) {
          <div class="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
            <fa-icon [icon]="faRecycle" size="2x" class="text-gray-300 dark:text-gray-600" />
            <p class="text-sm">Recycle bin is empty</p>
          </div>
        } @else {
          <!-- Notebooks -->
          @if (notebooks().length > 0) {
            <div class="px-3 pt-3 pb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Notebooks</span>
            </div>
            <ul class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (nb of notebooks(); track nb.id) {
                <li class="px-3 py-2.5">
                  <div class="flex items-start gap-2">
                    <fa-icon [icon]="faBook" class="mt-0.5 shrink-0 text-gray-400" size="sm" />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="nb.title">{{ nb.title }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ daysRemaining(nb.deletedAt) }}</p>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <button
                        (click)="onRestoreNotebook(nb)"
                        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-green-600 dark:hover:bg-gray-700 dark:hover:text-green-400"
                        title="Restore"
                      >
                        <fa-icon [icon]="faTrashArrowUp" size="sm" />
                      </button>
                      <button
                        (click)="confirmingPermanentDelete.set({ type: 'notebook', id: nb.id, title: nb.title })"
                        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                        title="Delete permanently"
                      >
                        <fa-icon [icon]="faTrash" size="xs" />
                      </button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          }

          <!-- Sections -->
          @if (sections().length > 0) {
            <div class="px-3 pt-3 pb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Sections</span>
            </div>
            <ul class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (sec of sections(); track sec.id) {
                <li class="px-3 py-2.5">
                  <div class="flex items-start gap-2">
                    <fa-icon [icon]="faLayerGroup" class="mt-0.5 shrink-0 text-gray-400" size="sm" />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="sec.title">{{ sec.title }}</p>
                      <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ sec.notebookTitle }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ daysRemaining(sec.deletedAt) }}</p>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <button
                        (click)="onRestoreSection(sec)"
                        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-green-600 dark:hover:bg-gray-700 dark:hover:text-green-400"
                        title="Restore"
                      >
                        <fa-icon [icon]="faTrashArrowUp" size="sm" />
                      </button>
                      <button
                        (click)="confirmingPermanentDelete.set({ type: 'section', id: sec.id, title: sec.title })"
                        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                        title="Delete permanently"
                      >
                        <fa-icon [icon]="faTrash" size="xs" />
                      </button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          }

          <!-- Notes -->
          @if (notes().length > 0) {
            <div class="px-3 pt-3 pb-1">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Notes</span>
            </div>
            <ul class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (note of notes(); track note.id) {
                <li class="px-3 py-2.5">
                  <div class="flex items-start gap-2">
                    <fa-icon [icon]="faStickyNote" class="mt-0.5 shrink-0 text-gray-400" size="sm" />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="note.title">{{ note.title }}</p>
                      <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ note.notebookTitle }} &rsaquo; {{ note.sectionTitle }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">{{ daysRemaining(note.deletedAt) }}</p>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <button
                        (click)="onRestoreNote(note)"
                        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-green-600 dark:hover:bg-gray-700 dark:hover:text-green-400"
                        title="Restore"
                      >
                        <fa-icon [icon]="faTrashArrowUp" size="sm" />
                      </button>
                      <button
                        (click)="confirmingPermanentDelete.set({ type: 'note', id: note.id, title: note.title })"
                        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                        title="Delete permanently"
                      >
                        <fa-icon [icon]="faTrash" size="xs" />
                      </button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          }
        }

        @if (confirmingPermanentDelete()) {
          <div class="px-3 py-2">
            <app-confirm-dialog
              [message]="'Permanently delete ' + confirmingPermanentDelete()!.title + '? This cannot be undone.'"
              confirmLabel="Delete forever"
              (confirmed)="permanentlyDelete()"
              (cancelled)="confirmingPermanentDelete.set(null)"
            />
          </div>
        }
      </div>
    </div>

    <app-restore-location-dialog
      [open]="!!restoringNote()"
      [noteTitle]="restoringNote()?.title ?? ''"
      [defaultNotebookId]="restoringNote()?.notebookId ?? null"
      [defaultSectionId]="restoringNote()?.sectionId ?? null"
      (confirmed)="onRestoreNoteConfirmed($event)"
      (cancelled)="restoringNote.set(null)"
    />
  `,
})
export class RecycleBinPanel implements OnInit {
  private recycleBinSvc = inject(RecycleBinService);
  private state = inject(ShellStateService);

  protected faBook = faBook;
  protected faLayerGroup = faLayerGroup;
  protected faStickyNote = faStickyNote;
  protected faTrashArrowUp = faTrashArrowUp;
  protected faTrash = faTrash;
  protected faRecycle = faRecycle;
  protected faSpinner = faSpinner;

  protected notebooks = signal<DeletedNotebookDto[]>([]);
  protected sections = signal<DeletedSectionDto[]>([]);
  protected notes = signal<DeletedNoteDto[]>([]);
  protected loading = signal(false);
  protected confirmingEmpty = signal(false);
  protected confirmingPermanentDelete = signal<{ type: 'notebook' | 'section' | 'note'; id: number; title: string } | null>(null);
  protected restoringNote = signal<DeletedNoteDto | null>(null);

  protected totalItems = () => this.notebooks().length + this.sections().length + this.notes().length;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.recycleBinSvc.getAll().subscribe({
      next: (data) => {
        this.notebooks.set(data.notebooks);
        this.sections.set(data.sections);
        this.notes.set(data.notes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected daysRemaining(deletedAt: string): string {
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted);
    expiry.setDate(expiry.getDate() + 30);
    const now = new Date();
    const days = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  }

  protected onRestoreNotebook(nb: DeletedNotebookDto): void {
    this.recycleBinSvc.restoreNotebook(nb.id).subscribe(() => {
      this.notebooks.update((list) => list.filter((n) => n.id !== nb.id));
      this.state.loadNotebooks();
    });
  }

  protected onRestoreSection(sec: DeletedSectionDto): void {
    this.recycleBinSvc.restoreSection(sec.id).subscribe(() => {
      this.sections.update((list) => list.filter((s) => s.id !== sec.id));
      this.state.loadNotebooks();
      this.state.reloadCurrentSections();
    });
  }

  protected onRestoreNote(note: DeletedNoteDto): void {
    this.restoringNote.set(note);
  }

  protected onRestoreNoteConfirmed(result: RestoreLocationResult): void {
    const note = this.restoringNote();
    if (!note) return;
    this.restoringNote.set(null);
    this.recycleBinSvc.restoreNote(note.id, result.sectionId).subscribe(() => {
      this.notes.update((list) => list.filter((n) => n.id !== note.id));
      this.state.reloadCurrentNotes();
    });
  }

  protected permanentlyDelete(): void {
    const item = this.confirmingPermanentDelete();
    if (!item) return;
    this.confirmingPermanentDelete.set(null);

    switch (item.type) {
      case 'notebook':
        this.recycleBinSvc.permanentlyDeleteNotebook(item.id).subscribe(() => {
          this.notebooks.update((list) => list.filter((n) => n.id !== item.id));
        });
        break;
      case 'section':
        this.recycleBinSvc.permanentlyDeleteSection(item.id).subscribe(() => {
          this.sections.update((list) => list.filter((s) => s.id !== item.id));
        });
        break;
      case 'note':
        this.recycleBinSvc.permanentlyDeleteNote(item.id).subscribe(() => {
          this.notes.update((list) => list.filter((n) => n.id !== item.id));
        });
        break;
    }
  }

  protected emptyBin(): void {
    this.confirmingEmpty.set(false);
    this.recycleBinSvc.emptyAll().subscribe(() => {
      this.notebooks.set([]);
      this.sections.set([]);
      this.notes.set([]);
    });
  }
}
