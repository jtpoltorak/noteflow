import { Component, inject, input, output, signal, effect, HostListener } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFile } from '@fortawesome/free-regular-svg-icons';
import { faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../modal/modal';
import { TemplateService } from '../../core/services/template.service';
import { NOTE_TEMPLATES, TEMPLATE_CATEGORIES, type NoteTemplate } from './templates.config';
import type { UserTemplateDto } from '@noteflow/shared-types';

export type SelectedTemplate = { name: string; content: string } | null;

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

        <!-- User's custom templates -->
        @if (userTemplates().length > 0) {
          <div>
            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">My Templates</h3>
            <div class="space-y-1">
              @for (tmpl of userTemplates(); track tmpl.id) {
                <div class="group flex items-center gap-1">
                  <button
                    (click)="selected.emit(tmpl)"
                    class="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700/50"
                  >
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-500 dark:bg-purple-900/40 dark:text-purple-400">
                      <fa-icon [icon]="faUser" size="sm" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ tmpl.name }}</p>
                      @if (tmpl.description) {
                        <p class="truncate text-xs text-gray-400 dark:text-gray-500">{{ tmpl.description }}</p>
                      }
                    </div>
                  </button>
                  <button
                    (click)="deleteTemplate(tmpl.id)"
                    class="shrink-0 rounded p-1.5 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-red-400"
                    title="Delete template"
                  >
                    <fa-icon [icon]="faTrash" size="xs" />
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Built-in templates grouped by category -->
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
  selected = output<SelectedTemplate>();

  private templateSvc = inject(TemplateService);

  protected faFile = faFile;
  protected faUser = faUser;
  protected faTrash = faTrash;
  protected categories = TEMPLATE_CATEGORIES;
  protected userTemplates = signal<UserTemplateDto[]>([]);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.templateSvc.getAll().subscribe((list) => this.userTemplates.set(list));
      }
    });
  }

  @HostListener('document:keydown.enter')
  onEnter(): void {
    if (this.open()) {
      this.selected.emit(null);
    }
  }

  protected getByCategory(category: string): NoteTemplate[] {
    return NOTE_TEMPLATES.filter((t) => t.category === category);
  }

  protected deleteTemplate(id: number): void {
    this.templateSvc.delete(id).subscribe(() => {
      this.userTemplates.update((list) => list.filter((t) => t.id !== id));
    });
  }
}
