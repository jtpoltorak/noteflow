import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="mt-1 rounded border border-red-200 bg-red-50 p-2">
      <p class="mb-2 text-sm text-red-700">{{ message() }}</p>
      <div class="flex gap-2">
        <button
          (click)="confirmed.emit()"
          class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Delete
        </button>
        <button
          (click)="cancelled.emit()"
          class="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  message = input('Are you sure you want to delete this?');
  confirmed = output();
  cancelled = output();
}
