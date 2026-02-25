import { Component, inject, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ShellStateService } from './shell-state.service';
import { NotebookList } from './notebook-list/notebook-list';
import { SectionList } from './section-list/section-list';
import { NoteArea } from './note-area/note-area';

@Component({
  selector: 'app-shell',
  imports: [NotebookList, SectionList, NoteArea, FaIconComponent],
  providers: [ShellStateService],
  template: `
    <div class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Top bar -->
      <header class="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-100">NoteFlow</h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user()?.email }}</span>
          <button
            (click)="theme.toggle()"
            class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Toggle dark mode"
          >
            <fa-icon [icon]="theme.darkMode() ? faSun : faMoon" size="sm" />
          </button>
          <button
            (click)="onLogout()"
            class="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <!-- Three-panel layout -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left panel: Notebooks -->
        <aside class="flex w-56 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          <app-notebook-list />
        </aside>

        <!-- Middle panel: Sections -->
        <aside class="flex w-52 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <app-section-list />
        </aside>

        <!-- Main area: Notes + Editor -->
        <main class="flex flex-1 flex-col bg-white dark:bg-gray-800">
          <app-note-area />
        </main>
      </div>
    </div>
  `,
})
export class Shell implements OnInit {
  protected auth = inject(AuthService);
  protected theme = inject(ThemeService);
  private state = inject(ShellStateService);

  protected faMoon = faMoon;
  protected faSun = faSun;

  ngOnInit(): void {
    this.state.loadNotebooks();
  }

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}
