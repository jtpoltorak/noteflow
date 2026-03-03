import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faMinus,
  faTableColumns,
  faToggleOn,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-table-toolbar',
  imports: [FaIconComponent],
  template: `
    <div
      class="fixed z-50 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      [style.top.px]="position().top"
      [style.left.px]="position().left"
    >
      <!-- Row controls -->
      <button
        (mousedown)="$event.preventDefault()"
        (click)="addRow.emit()"
        class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Add row below"
      >
        <fa-icon [icon]="faPlus" size="xs" /> Row
      </button>
      <button
        (mousedown)="$event.preventDefault()"
        (click)="deleteRow.emit()"
        class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
        title="Delete row"
      >
        <fa-icon [icon]="faMinus" size="xs" /> Row
      </button>

      <div class="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600"></div>

      <!-- Column controls -->
      <button
        (mousedown)="$event.preventDefault()"
        (click)="addColumn.emit()"
        class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Add column to the right"
      >
        <fa-icon [icon]="faPlus" size="xs" /> Col
      </button>
      <button
        (mousedown)="$event.preventDefault()"
        (click)="deleteColumn.emit()"
        class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
        title="Delete column"
      >
        <fa-icon [icon]="faMinus" size="xs" /> Col
      </button>

      <div class="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600"></div>

      <!-- Toggle header -->
      <button
        (mousedown)="$event.preventDefault()"
        (click)="toggleHeader.emit()"
        class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Toggle header row"
      >
        <fa-icon [icon]="faToggleOn" size="xs" /> Header
      </button>

      <div class="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600"></div>

      <!-- Delete table -->
      <button
        (mousedown)="$event.preventDefault()"
        (click)="deleteTable.emit()"
        class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
        title="Delete table"
      >
        <fa-icon [icon]="faTrash" size="xs" />
      </button>
    </div>
  `,
})
export class TableToolbar {
  position = input<{ top: number; left: number }>({ top: 0, left: 0 });

  addRow = output<void>();
  deleteRow = output<void>();
  addColumn = output<void>();
  deleteColumn = output<void>();
  toggleHeader = output<void>();
  deleteTable = output<void>();

  protected readonly faPlus = faPlus;
  protected readonly faMinus = faMinus;
  protected readonly faTableColumns = faTableColumns;
  protected readonly faToggleOn = faToggleOn;
  protected readonly faTrash = faTrash;
}
