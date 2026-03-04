import { Component, inject, output, signal, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBook, faFolder, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../../../shared/modal/modal';
import { NotebookService } from '../../../core/services/notebook.service';
import { SectionService } from '../../../core/services/section.service';
import type { NotebookDto, SectionDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-unarchive-dialog',
  imports: [FaIconComponent, Modal],
  template: `
    <app-modal [open]="true" title="Restore note" (closed)="cancelled.emit()">
      <!-- Notebooks list -->
      <div class="space-y-1">
        @if (loading()) {
          <div class="flex items-center justify-center py-6 text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            <span class="ml-2 text-sm">Loading...</span>
          </div>
        } @else {
          @for (nb of notebooks(); track nb.id) {
            <div>
              <button
                (click)="selectNotebook(nb)"
                class="flex w-full items-center rounded px-3 py-2 text-sm transition-colors"
                [class.bg-blue-50]="selectedNotebookId() === nb.id"
                [class.dark:bg-blue-900/30]="selectedNotebookId() === nb.id"
                [class.text-blue-700]="selectedNotebookId() === nb.id"
                [class.dark:text-blue-300]="selectedNotebookId() === nb.id"
                [class.text-gray-700]="selectedNotebookId() !== nb.id"
                [class.dark:text-gray-200]="selectedNotebookId() !== nb.id"
                [class.hover:bg-gray-100]="selectedNotebookId() !== nb.id"
                [class.dark:hover:bg-gray-700]="selectedNotebookId() !== nb.id"
              >
                <fa-icon [icon]="faBook" class="mr-2 text-gray-400" size="sm" />
                <span class="flex-1 truncate text-left">{{ nb.title }}</span>
                <fa-icon [icon]="faChevronRight" class="text-gray-400" size="xs" />
              </button>

              <!-- Sections for selected notebook -->
              @if (selectedNotebookId() === nb.id) {
                <div class="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                  @if (loadingSections()) {
                    <div class="flex items-center py-2 text-gray-400">
                      <fa-icon [icon]="faSpinner" class="animate-spin" size="sm" />
                      <span class="ml-2 text-xs">Loading sections...</span>
                    </div>
                  } @else {
                    @for (sec of sections(); track sec.id) {
                      <button
                        (click)="selectSection(sec)"
                        class="flex w-full items-center rounded px-3 py-1.5 text-sm transition-colors"
                        [class.bg-blue-100]="selectedSectionId() === sec.id"
                        [class.dark:bg-blue-900/40]="selectedSectionId() === sec.id"
                        [class.text-blue-700]="selectedSectionId() === sec.id"
                        [class.dark:text-blue-300]="selectedSectionId() === sec.id"
                        [class.text-gray-600]="selectedSectionId() !== sec.id"
                        [class.dark:text-gray-300]="selectedSectionId() !== sec.id"
                        [class.hover:bg-gray-100]="selectedSectionId() !== sec.id"
                        [class.dark:hover:bg-gray-700]="selectedSectionId() !== sec.id"
                      >
                        <fa-icon [icon]="faFolder" class="mr-2 text-gray-400" size="sm" />
                        <span class="truncate text-left">{{ sec.title }}</span>
                      </button>
                    } @empty {
                      <p class="px-3 py-2 text-xs text-gray-400">No sections in this notebook</p>
                    }
                  }
                </div>
              }
            </div>
          } @empty {
            <p class="py-4 text-center text-sm text-gray-400">No notebooks found</p>
          }
        }
      </div>

      <!-- Restore button -->
      @if (selectedSectionId()) {
        <div class="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
          <button
            (click)="restored.emit(selectedSectionId()!)"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Restore here
          </button>
        </div>
      }
    </app-modal>
  `,
})
export class UnarchiveDialog implements OnInit {
  private notebookSvc = inject(NotebookService);
  private sectionSvc = inject(SectionService);

  restored = output<number>();
  cancelled = output();

  protected faBook = faBook;
  protected faFolder = faFolder;
  protected faChevronRight = faChevronRight;
  protected faSpinner = faSpinner;

  protected notebooks = signal<NotebookDto[]>([]);
  protected sections = signal<SectionDto[]>([]);
  protected loading = signal(false);
  protected loadingSections = signal(false);
  protected selectedNotebookId = signal<number | null>(null);
  protected selectedSectionId = signal<number | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.notebookSvc.getAll().subscribe({
      next: (list) => {
        this.notebooks.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected selectNotebook(nb: NotebookDto): void {
    if (this.selectedNotebookId() === nb.id) {
      this.selectedNotebookId.set(null);
      this.sections.set([]);
      this.selectedSectionId.set(null);
      return;
    }
    this.selectedNotebookId.set(nb.id);
    this.selectedSectionId.set(null);
    this.loadingSections.set(true);
    this.sectionSvc.getByNotebook(nb.id).subscribe({
      next: (list) => {
        this.sections.set(list);
        this.loadingSections.set(false);
      },
      error: () => this.loadingSections.set(false),
    });
  }

  protected selectSection(sec: SectionDto): void {
    this.selectedSectionId.set(sec.id);
  }
}
