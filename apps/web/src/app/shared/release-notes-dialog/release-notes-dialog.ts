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
        @for (group of releaseNotes; track group.version) {
          <div class="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
            <div class="mb-1.5 flex items-center gap-2">
              <span class="font-semibold text-gray-800 dark:text-gray-100">v{{ group.version }}</span>
              <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">{{ group.date }}</span>
            </div>
            <ul class="ml-4 list-disc space-y-0.5">
              @for (item of group.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
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
