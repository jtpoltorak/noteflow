import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-feedback-dialog',
  imports: [Modal, FormsModule, FaIconComponent],
  template: `
    <app-modal [open]="open()" title="Send Feedback" (closed)="onClose()">
      @if (submitted()) {
        <div class="flex flex-col items-center gap-3 py-4 text-center">
          <fa-icon [icon]="faCircleCheck" class="text-3xl text-green-500" />
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Thank you for your feedback!</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">We appreciate you taking the time to share your thoughts.</p>
        </div>
      } @else {
        <img src="noteflow-logo.svg" alt="NoteFlow" class="mb-4 h-8 dark:invert" />
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="feedback-type" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select
              id="feedback-type"
              [(ngModel)]="feedbackType"
              name="feedbackType"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="general">General Feedback</option>
              <option value="enhancement">Enhancement Request</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>

          <div>
            <label for="feedback-message" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <textarea
              id="feedback-message"
              [(ngModel)]="feedbackMessage"
              name="feedbackMessage"
              rows="4"
              required
              class="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Tell us what's on your mind..."
            ></textarea>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="!feedbackMessage.trim()"
              class="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </form>
      }
    </app-modal>
  `,
})
export class FeedbackDialog {
  open = input(false);
  closed = output();

  protected faCircleCheck = faCircleCheck;

  feedbackType = 'general';
  feedbackMessage = '';
  submitted = signal(false);

  onSubmit(): void {
    this.submitted.set(true);
  }

  onClose(): void {
    this.feedbackType = 'general';
    this.feedbackMessage = '';
    this.submitted.set(false);
    this.closed.emit();
  }
}
