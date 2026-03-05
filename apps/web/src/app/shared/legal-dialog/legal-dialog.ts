import { Component, input, output } from '@angular/core';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-legal-dialog',
  imports: [Modal],
  template: `
    <app-modal [open]="open()" [title]="title()" (closed)="closed.emit()">
      <div class="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        @switch (section()) {
          @case ('terms') {
            <p>
              NoteFlow is a personal portfolio and demonstration project. By using it, you acknowledge the following:
            </p>
            <ul class="ml-4 list-disc space-y-1">
              <li>This application is not intended for production use or for storing sensitive, confidential, or irreplaceable data.</li>
              <li>Features may change, break, or be removed without notice.</li>
              <li>There are no guarantees of uptime, availability, or data persistence.</li>
              <li>You are responsible for maintaining your own backups of any content you create.</li>
            </ul>
          }
          @case ('privacy') {
            <p>
              NoteFlow collects the minimum data needed to function:
            </p>
            <ul class="ml-4 list-disc space-y-1">
              <li><strong>Account info</strong> &mdash; your email address and a securely hashed password. Passwords are never stored in plain text.</li>
              <li><strong>Your notes</strong> &mdash; notebooks, sections, and note content are stored in a server-side database so you can access them across sessions.</li>
              <li><strong>No tracking</strong> &mdash; there are no analytics, no advertising cookies, and no third-party tracking scripts.</li>
              <li><strong>No data sharing</strong> &mdash; your data is not sold, shared with, or disclosed to any third party.</li>
            </ul>
          }
          @case ('disclaimer') {
            <p>
              NoteFlow is provided <strong>"as is"</strong> without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              The developer is not liable for any data loss, corruption, downtime, or damages of any kind arising from your use of this application.
            </p>
            <p>
              This is a demonstration project built for learning and portfolio purposes &mdash; not a commercial product. Use it at your own risk.
            </p>
          }
        }
      </div>
    </app-modal>
  `,
})
export class LegalDialog {
  open = input(false);
  section = input<'terms' | 'privacy' | 'disclaimer'>('terms');
  title = input('');
  closed = output();
}
