import { Component, inject, input, output, signal, effect } from '@angular/core';
import { Modal } from '../modal/modal';
import { NotebookService } from '../../core/services/notebook.service';
import { SectionService } from '../../core/services/section.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { NotebookDto, SectionDto } from '@noteflow/shared-types';

export interface RestoreLocationResult {
  sectionId: number;
}

@Component({
  selector: 'app-restore-location-dialog',
  imports: [Modal, FaIconComponent],
  template: `
    <app-modal [open]="open()" title="Restore Note" (closed)="cancelled.emit()">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Choose where to restore <span class="font-medium">"{{ noteTitle() }}"</span>
        </p>

        <!-- Notebook select -->
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Notebook</label>
          <select
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            [value]="selectedNotebookId()"
            (change)="onNotebookChange($event)"
          >
            <option [value]="0" disabled>Select a notebook…</option>
            @for (nb of notebooks(); track nb.id) {
              <option [value]="nb.id">{{ nb.title }}</option>
            }
          </select>
        </div>

        <!-- Section select -->
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Section</label>
          @if (loadingSections()) {
            <div class="flex items-center gap-2 py-2 text-sm text-gray-400">
              <fa-icon [icon]="faSpinner" class="animate-spin" size="sm" />
              Loading sections…
            </div>
          } @else {
            <select
              class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              [value]="selectedSectionId()"
              (change)="onSectionChange($event)"
              [disabled]="sections().length === 0"
            >
              @if (sections().length === 0) {
                <option [value]="0">No sections available</option>
              } @else {
                <option [value]="0" disabled>Select a section…</option>
                @for (sec of sections(); track sec.id) {
                  <option [value]="sec.id">{{ sec.title }}</option>
                }
              }
            </select>
          }
        </div>

        @if (originalMissing()) {
          <p class="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            The original location no longer exists. Please choose a new location.
          </p>
        }

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-1">
          <button
            (click)="cancelled.emit()"
            class="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            (click)="onConfirm()"
            [disabled]="!selectedSectionId() || selectedSectionId() === 0"
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Restore
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class RestoreLocationDialog {
  private notebookSvc = inject(NotebookService);
  private sectionSvc = inject(SectionService);

  open = input(false);
  noteTitle = input('');
  defaultNotebookId = input<number | null>(null);
  defaultSectionId = input<number | null>(null);

  confirmed = output<RestoreLocationResult>();
  cancelled = output();

  protected faSpinner = faSpinner;

  protected notebooks = signal<NotebookDto[]>([]);
  protected sections = signal<SectionDto[]>([]);
  protected selectedNotebookId = signal<number>(0);
  protected selectedSectionId = signal<number>(0);
  protected loadingSections = signal(false);
  protected originalMissing = signal(false);

  constructor() {
    // Load notebooks and set defaults when dialog opens
    effect(() => {
      if (this.open()) {
        this.loadNotebooksAndSetDefaults();
      }
    });
  }

  private loadNotebooksAndSetDefaults(): void {
    this.notebookSvc.getAll().subscribe((list) => {
      this.notebooks.set(list);

      const defaultNb = this.defaultNotebookId();
      const nbExists = defaultNb ? list.some((nb) => nb.id === defaultNb) : false;

      if (nbExists && defaultNb) {
        this.selectedNotebookId.set(defaultNb);
        this.loadSectionsForNotebook(defaultNb, true);
      } else {
        this.originalMissing.set(true);
        this.selectedNotebookId.set(0);
        this.sections.set([]);
        this.selectedSectionId.set(0);
      }
    });
  }

  private loadSectionsForNotebook(notebookId: number, setDefault: boolean): void {
    this.loadingSections.set(true);
    this.sectionSvc.getByNotebook(notebookId).subscribe((list) => {
      this.sections.set(list);
      this.loadingSections.set(false);

      if (setDefault) {
        const defaultSec = this.defaultSectionId();
        const secExists = defaultSec ? list.some((s) => s.id === defaultSec) : false;
        if (secExists && defaultSec) {
          this.selectedSectionId.set(defaultSec);
        } else {
          this.originalMissing.set(true);
          this.selectedSectionId.set(0);
        }
      } else {
        this.selectedSectionId.set(0);
      }
    });
  }

  protected onNotebookChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedNotebookId.set(id);
    this.selectedSectionId.set(0);
    if (id) {
      this.loadSectionsForNotebook(id, false);
    } else {
      this.sections.set([]);
    }
  }

  protected onSectionChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedSectionId.set(id);
  }

  protected onConfirm(): void {
    const sectionId = this.selectedSectionId();
    if (sectionId) {
      this.confirmed.emit({ sectionId });
    }
  }
}
