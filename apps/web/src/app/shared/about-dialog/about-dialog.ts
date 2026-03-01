import { Component, input, output } from '@angular/core';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-about-dialog',
  imports: [Modal],
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
          Developed by jtpoltorak with AI-assisted coding.
        </p>
      </div>
    </app-modal>
  `,
})
export class AboutDialog {
  open = input(false);
  closed = output();
}
