import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="mt-1 rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/30">
      <p class="mb-2 text-sm text-red-700 dark:text-red-300">{{ message() }}</p>
      <div class="flex gap-2">
        <button
          (click)="confirmed.emit()"
          class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          {{ confirmLabel() }}
        </button>
        <button
          (click)="cancelled.emit()"
          class="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  message = input('Are you sure you want to delete this?');
  confirmLabel = input('Delete');
  confirmed = output();
  cancelled = output();
}
