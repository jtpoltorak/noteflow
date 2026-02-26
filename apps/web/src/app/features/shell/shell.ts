import { Component, inject, OnInit, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faCircleQuestion, faCommentDots, faMoon, faSun, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ShellStateService } from './shell-state.service';
import { NotebookList } from './notebook-list/notebook-list';
import { SectionList } from './section-list/section-list';
import { NoteArea } from './note-area/note-area';
import { AboutDialog } from '../../shared/about-dialog/about-dialog';
import { FeedbackDialog } from '../../shared/feedback-dialog/feedback-dialog';
import { HelpPanel } from './help-panel/help-panel';

@Component({
  selector: 'app-shell',
  imports: [NotebookList, SectionList, NoteArea, FaIconComponent, AboutDialog, FeedbackDialog, HelpPanel],
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
            (click)="helpOpen.set(!helpOpen())"
            class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            [class.text-blue-500]="helpOpen()"
            [class.dark:text-blue-400]="helpOpen()"
            title="Toggle help"
          >
            <fa-icon [icon]="faCircleQuestion" size="sm" />
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
        @if (notebooksCollapsed()) {
          <div class="flex w-8 flex-col items-center border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <button
              (click)="notebooksCollapsed.set(false)"
              class="mt-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Expand notebooks"
            >
              <fa-icon [icon]="faChevronRight" size="xs" />
            </button>
          </div>
        } @else {
          <aside class="flex w-56 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <app-notebook-list (collapse)="notebooksCollapsed.set(true)" />
          </aside>
        }

        <!-- Middle panel: Sections -->
        @if (sectionsCollapsed()) {
          <div class="flex w-8 flex-col items-center border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <button
              (click)="sectionsCollapsed.set(false)"
              class="mt-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Expand sections"
            >
              <fa-icon [icon]="faChevronRight" size="xs" />
            </button>
          </div>
        } @else {
          <aside class="flex w-52 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <app-section-list (collapse)="sectionsCollapsed.set(true)" />
          </aside>
        }

        <!-- Main area: Notes + Editor -->
        <main class="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-800">
          <app-note-area [collapsed]="notesCollapsed()" (toggleCollapsed)="notesCollapsed.set(!notesCollapsed())" />
        </main>

        @if (helpOpen()) {
          <aside class="flex w-72 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <app-help-panel (close)="helpOpen.set(false)" />
          </aside>
        }
      </div>

      <!-- Footer -->
      <footer class="flex h-8 items-center gap-3 border-t border-gray-200 bg-white px-4 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <span>&copy; {{ currentYear }} jtpoltorak</span>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <button (click)="showAbout.set(true)" class="inline-flex cursor-pointer items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
          <fa-icon [icon]="faCircleInfo" size="xs" />
          About
        </button>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <button (click)="showFeedback.set(true)" class="inline-flex cursor-pointer items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
          <fa-icon [icon]="faCommentDots" size="xs" />
          Send Feedback
        </button>
      </footer>
    </div>

    <app-about-dialog [open]="showAbout()" (closed)="showAbout.set(false)" />
    <app-feedback-dialog [open]="showFeedback()" (closed)="showFeedback.set(false)" />
  `,
})
export class Shell implements OnInit {
  protected auth = inject(AuthService);
  protected theme = inject(ThemeService);
  private state = inject(ShellStateService);

  protected faMoon = faMoon;
  protected faSun = faSun;
  protected faCircleInfo = faCircleInfo;
  protected faCommentDots = faCommentDots;
  protected faChevronRight = faChevronRight;
  protected faCircleQuestion = faCircleQuestion;

  protected notebooksCollapsed = signal(false);
  protected sectionsCollapsed = signal(false);
  protected notesCollapsed = signal(false);
  protected helpOpen = signal(false);
  protected showAbout = signal(false);
  protected showFeedback = signal(false);
  protected currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.state.loadNotebooks();
  }

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}
