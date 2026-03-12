import { Component, input, output, signal } from '@angular/core';
import { Modal } from '../modal/modal';
import { ReleaseNotesDialog } from '../release-notes-dialog/release-notes-dialog';
import { APP_VERSION } from '../../version';

@Component({
  selector: 'app-about-dialog',
  imports: [Modal, ReleaseNotesDialog],
  template: `
    <app-modal [open]="open()" title="About NoteFlow" (closed)="closed.emit()">
      <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <img src="noteflow-logo.svg" alt="NoteFlow" class="h-8 dark:invert" />
        <p>
          A web-based note-taking application inspired by Microsoft OneNote.
        </p>
        <p>
          Built as a full-stack TypeScript portfolio project featuring Angular, Express, and SQLite.
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Developed by Jonathan T. Poltorak with AI-assisted coding.
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Version <button (click)="showReleaseNotes.set(true)" class="underline hover:text-gray-600 dark:hover:text-gray-300">{{ appVersion }}</button>
        </p>
      </div>
    </app-modal>
    <app-release-notes-dialog [open]="showReleaseNotes()" (closed)="showReleaseNotes.set(false)" />
  `,
})
export class AboutDialog {
  open = input(false);
  closed = output();

  protected appVersion = APP_VERSION;
  protected showReleaseNotes = signal(false);
}
