import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ShellStateService } from './shell-state.service';
import { NotebookList } from './notebook-list/notebook-list';
import { SectionList } from './section-list/section-list';
import { NoteArea } from './note-area/note-area';

@Component({
  selector: 'app-shell',
  imports: [NotebookList, SectionList, NoteArea],
  providers: [ShellStateService],
  template: `
    <div class="flex h-screen flex-col bg-gray-50">
      <!-- Top bar -->
      <header class="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
        <h1 class="text-lg font-semibold text-gray-800">NoteFlow</h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">{{ auth.user()?.email }}</span>
          <button
            (click)="onLogout()"
            class="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <!-- Three-panel layout -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left panel: Notebooks -->
        <aside class="flex w-56 flex-col border-r border-gray-200 bg-gray-50">
          <app-notebook-list />
        </aside>

        <!-- Middle panel: Sections -->
        <aside class="flex w-52 flex-col border-r border-gray-200 bg-white">
          <app-section-list />
        </aside>

        <!-- Main area: Notes + Editor -->
        <main class="flex flex-1 flex-col bg-white">
          <app-note-area />
        </main>
      </div>
    </div>
  `,
})
export class Shell implements OnInit {
  protected auth = inject(AuthService);
  private state = inject(ShellStateService);

  ngOnInit(): void {
    this.state.loadNotebooks();
  }

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}
