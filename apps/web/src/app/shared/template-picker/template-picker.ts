import { Component, input, output, HostListener } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFile } from '@fortawesome/free-regular-svg-icons';
import { Modal } from '../modal/modal';
import { NOTE_TEMPLATES, TEMPLATE_CATEGORIES, type NoteTemplate } from './templates.config';

@Component({
  selector: 'app-template-picker',
  imports: [Modal, FaIconComponent],
  template: `
    <app-modal [open]="open()" title="Choose a Template" (closed)="closed.emit()">
      <div class="space-y-4">
        <!-- Blank note (default/prominent) -->
        <button
          (click)="selected.emit(null)"
          class="flex w-full items-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:hover:border-blue-600 dark:hover:bg-blue-900/50"
        >
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
            <fa-icon [icon]="faFile" />
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">Blank Note</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Start with an empty note</p>
          </div>
        </button>

        <!-- Templates grouped by category -->
        @for (category of categories; track category) {
          <div>
            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ category }}</h3>
            <div class="space-y-1">
              @for (tmpl of getByCategory(category); track tmpl.id) {
                <button
                  (click)="selected.emit(tmpl)"
                  class="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700/50"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    <fa-icon [icon]="tmpl.icon" size="sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ tmpl.name }}</p>
                    <p class="truncate text-xs text-gray-400 dark:text-gray-500">{{ tmpl.description }}</p>
                  </div>
                </button>
              }
            </div>
          </div>
        }
      </div>
    </app-modal>
  `,
})
export class TemplatePicker {
  open = input(false);
  closed = output();
  selected = output<NoteTemplate | null>();

  protected faFile = faFile;
  protected categories = TEMPLATE_CATEGORIES;

  @HostListener('document:keydown.enter')
  onEnter(): void {
    if (this.open()) {
      this.selected.emit(null);
    }
  }

  protected getByCategory(category: string): NoteTemplate[] {
    return NOTE_TEMPLATES.filter((t) => t.category === category);
  }
}
