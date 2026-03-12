import { Component, input, output } from '@angular/core';
import { Modal } from '../modal/modal';
import { APP_VERSION } from '../../version';
import { RELEASE_NOTES } from '../../release-notes';

@Component({
  selector: 'app-release-notes-dialog',
  imports: [Modal],
  template: `
    <app-modal [open]="open()" title="Release Notes" (closed)="closed.emit()">
      <div class="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        @for (entry of releaseNotes; track entry.version + entry.description) {
          <div class="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
            <div class="mb-1 flex items-center gap-2">
              <span class="font-semibold text-gray-800 dark:text-gray-100">v{{ entry.version }}</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                [class]="entry.type === 'feature'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'"
              >
                {{ entry.type === 'feature' ? 'Feature' : 'Bug Fix' }}
              </span>
              <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">{{ entry.date }}</span>
            </div>
            <p>{{ entry.description }}</p>
          </div>
        }
      </div>
    </app-modal>
  `,
})
export class ReleaseNotesDialog {
  open = input(false);
  closed = output();

  protected appVersion = APP_VERSION;
  protected releaseNotes = RELEASE_NOTES;
}
