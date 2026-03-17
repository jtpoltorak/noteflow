import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBook, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../../../shared/modal/modal';
import { NotebookService } from '../../../core/services/notebook.service';
import type { NotebookDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-move-section-dialog',
  imports: [FaIconComponent, Modal],
  template: `
    <app-modal [open]="true" title="Move section" (closed)="cancelled.emit()">
      <div class="space-y-1">
        @if (loading()) {
          <div class="flex items-center justify-center py-6 text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            <span class="ml-2 text-sm">Loading...</span>
          </div>
        } @else {
          @for (nb of filteredNotebooks(); track nb.id) {
            <button
              (click)="selectedId.set(nb.id)"
              class="flex w-full items-center rounded px-3 py-2 text-sm transition-colors"
              [class.bg-accent-50]="selectedId() === nb.id"
              [class.dark:bg-accent-900/30]="selectedId() === nb.id"
              [class.text-accent-700]="selectedId() === nb.id"
              [class.dark:text-accent-300]="selectedId() === nb.id"
              [class.text-gray-700]="selectedId() !== nb.id"
              [class.dark:text-gray-200]="selectedId() !== nb.id"
              [class.hover:bg-gray-100]="selectedId() !== nb.id"
              [class.dark:hover:bg-gray-700]="selectedId() !== nb.id"
            >
              <fa-icon [icon]="faBook" class="mr-2 text-gray-400" size="sm" />
              <span class="flex-1 truncate text-left">{{ nb.title }}</span>
            </button>
          } @empty {
            <p class="py-4 text-center text-sm text-gray-400">No other notebooks</p>
          }
        }
      </div>

      @if (selectedId()) {
        <div class="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
          <button
            (click)="moved.emit(selectedId()!)"
            class="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Move here
          </button>
        </div>
      }
    </app-modal>
  `,
})
export class MoveSectionDialog implements OnInit {
  private notebookSvc = inject(NotebookService);

  currentNotebookId = input.required<number>();
  moved = output<number>();
  cancelled = output();

  protected faBook = faBook;
  protected faSpinner = faSpinner;

  protected loading = signal(false);
  protected notebooks = signal<NotebookDto[]>([]);
  protected selectedId = signal<number | null>(null);

  protected filteredNotebooks = signal<NotebookDto[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.notebookSvc.getAll().subscribe({
      next: (list) => {
        this.notebooks.set(list);
        this.filteredNotebooks.set(list.filter((nb) => nb.id !== this.currentNotebookId()));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
