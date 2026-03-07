import { Component, input, output, signal, ElementRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-password-dialog',
  template: `
    <div class="mt-1 rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
      <p class="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">{{ message() }}</p>
      <input
        #passwordInput
        type="password"
        [placeholder]="placeholder()"
        minlength="4"
        maxlength="100"
        class="mb-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
        (keydown.enter)="submit(passwordInput.value)"
        (keydown.escape)="cancelled.emit()"
      />
      @if (showConfirm()) {
        <input
          #confirmInput
          type="password"
          placeholder="Confirm password"
          maxlength="100"
          class="mb-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
          (keydown.enter)="submit(passwordInput.value, confirmInput.value)"
          (keydown.escape)="cancelled.emit()"
        />
      }
      @if (error()) {
        <p class="mb-1 text-xs text-red-600 dark:text-red-400">{{ error() }}</p>
      }
      <div class="flex gap-2">
        <button
          (click)="submit(passwordInput.value, confirmInputRef()?.nativeElement?.value)"
          class="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          {{ submitLabel() }}
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
export class PasswordDialog {
  message = input('Enter password');
  placeholder = input('Password');
  submitLabel = input('Submit');
  showConfirm = input(false);

  submitted = output<string>();
  cancelled = output();

  protected error = signal('');
  protected confirmInputRef = viewChild<ElementRef<HTMLInputElement>>('confirmInput');

  protected submit(password: string, confirm?: string): void {
    if (password.length < 4) {
      this.error.set('Password must be at least 4 characters');
      return;
    }
    if (this.showConfirm() && password !== confirm) {
      this.error.set('Passwords do not match');
      return;
    }
    this.error.set('');
    this.submitted.emit(password);
  }
}
