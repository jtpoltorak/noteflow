import { Component, input, output, HostListener } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal',
  imports: [FaIconComponent],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative mx-4 flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800"
          style="max-height: calc(100vh - 3rem)"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ title() }}</h2>
            <button
              (click)="closed.emit()"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <fa-icon [icon]="faXmark" />
            </button>
          </div>

          <!-- Body -->
          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class Modal {
  open = input(false);
  title = input('');
  closed = output();

  protected faXmark = faXmark;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
