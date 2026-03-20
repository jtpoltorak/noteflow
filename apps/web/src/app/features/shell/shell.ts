import { Component, computed, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleQuestion, faMoon, faSun, faChevronRight, faChevronLeft, faMagnifyingGlass, faBoxArchive, faStar, faShareNodes, faTags, faGear, faPlus, faCloudArrowDown, faArrowRightFromBracket, faTrashCan, faUserClock, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ViewportService } from '../../core/services/viewport.service';
import { ShellStateService } from './shell-state.service';
import { NotebookList } from './notebook-list/notebook-list';
import { SectionList } from './section-list/section-list';
import { NoteArea } from './note-area/note-area';
import { NoteTree } from './note-tree/note-tree';
import { TreeStateService } from './note-tree/tree-state.service';
import { AboutDialog } from '../../shared/about-dialog/about-dialog';
import { FeedbackDialog } from '../../shared/feedback-dialog/feedback-dialog';
import { LegalDialog } from '../../shared/legal-dialog/legal-dialog';
import { SettingsDialog } from '../../shared/settings-dialog/settings-dialog';
import { HelpPanel } from './help-panel/help-panel';
import { Modal } from '../../shared/modal/modal';
import { NavRail, type ShellMode } from './nav-rail/nav-rail';
import { SearchPanel } from './search-panel/search-panel';
import { ArchivePanel } from './archive-panel/archive-panel';
import { FavoritesPanel } from './favorites-panel/favorites-panel';
import { SharedPanel } from './shared-panel/shared-panel';
import { TagsPanel } from './tags-panel/tags-panel';
import { RecycleBinPanel } from './recycle-bin-panel/recycle-bin-panel';
import { ToastContainer } from '../../shared/toast/toast-container';
import { ToastService } from '../../shared/toast/toast.service';
import { QuickNoteDialog, type QuickNoteResult } from '../../shared/quick-note-dialog/quick-note-dialog';
import { ReleaseNotesDialog } from '../../shared/release-notes-dialog/release-notes-dialog';
import { PwaService } from '../../core/services/pwa.service';
import { PwaUpdateService } from '../../core/services/pwa-update.service';
import { PomodoroService } from '../../core/services/pomodoro.service';
import { PomodoroTimer } from './pomodoro-timer/pomodoro-timer';
import type { SearchResultDto } from '@noteflow/shared-types';
import { APP_VERSION } from '../../version';

export type MobilePanel = 'notebooks' | 'sections' | 'notes' | 'editor' | 'search' | 'archive' | 'favorites' | 'shared' | 'tags' | 'recycle-bin';

@Component({
  selector: 'app-shell',
  imports: [NotebookList, SectionList, NoteArea, NoteTree, FaIconComponent, AboutDialog, FeedbackDialog, LegalDialog, SettingsDialog, HelpPanel, Modal, NavRail, SearchPanel, ArchivePanel, FavoritesPanel, SharedPanel, TagsPanel, RecycleBinPanel, QuickNoteDialog, ReleaseNotesDialog, ToastContainer, PomodoroTimer],
  providers: [ShellStateService, TreeStateService],
  template: `
    <div class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">

      <!-- ── Account closure banner ────────────────────────── -->
      @if (auth.user()?.deleteRequestedAt) {
        <div class="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <span>Your account is scheduled for deletion on {{ closureDeletionDate() }}.</span>
          <button
            (click)="onReactivate()"
            class="font-semibold underline hover:no-underline"
          >Cancel and keep my account</button>
        </div>
      }

      <!-- ── PWA update banner ─────────────────────────────── -->
      @if (pwaUpdate.updateAvailable()) {
        <div class="flex items-center justify-center gap-2 bg-accent-600 px-4 py-1.5 text-sm text-white">
          <span>A new version of NoteFlow is available.</span>
          <button
            (click)="pwaUpdate.activateUpdate()"
            class="rounded bg-white/20 px-2 py-0.5 text-sm font-medium hover:bg-white/30"
          >
            Update now
          </button>
        </div>
      }

      <!-- ── Header ──────────────────────────────────────────── -->
      @if (vp.isDesktop()) {
        <header class="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-center gap-6">
            <img src="noteflow-logo.svg" alt="NoteFlow" class="h-7 dark:invert" />
            <button
              (click)="showQuickNote.set(true)"
              class="flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
              title="Quick Note"
            >
              <fa-icon [icon]="faPlus" size="sm" />
              Quick Note
            </button>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user()?.email }}</span>
            <button
              (click)="theme.toggle()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Toggle dark mode"
            >
              <fa-icon [icon]="theme.darkMode() ? faSun : faMoon" size="sm" />
            </button>
            @if (pwa.canInstall()) {
              <button
                (click)="pwa.promptInstall()"
                class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Install NoteFlow app"
              >
                <fa-icon [icon]="faCloudArrowDown" size="sm" />
              </button>
            }
            <button
              (click)="pomo.toggle()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-accent-500]="pomo.isVisible()"
              [class.dark:text-accent-400]="pomo.isVisible()"
              title="Pomodoro timer"
            >
              <fa-icon [icon]="faUserClock" size="sm" />
            </button>
            <button
              (click)="showSettings.set(true)"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Account settings"
            >
              <fa-icon [icon]="faGear" size="sm" />
            </button>
            <button
              (click)="helpOpen.set(!helpOpen())"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-accent-500]="helpOpen()"
              [class.dark:text-accent-400]="helpOpen()"
              title="Toggle help"
            >
              <fa-icon [icon]="faCircleQuestion" size="sm" />
            </button>
            <button
              (click)="onLogout()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Sign out"
            >
              <fa-icon [icon]="faArrowRightFromBracket" size="sm" />
            </button>
          </div>
        </header>
      } @else {
        <!-- Compact header -->
        <header class="flex min-h-12 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            @if (mobilePanel() !== 'notebooks') {
              <button
                (click)="goBack()"
                class="shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Go back"
              >
                <fa-icon [icon]="faChevronLeft" size="sm" />
              </button>
            }
            @if (mobilePanel() === 'notebooks') {
              <img src="nf-logo.svg" alt="NoteFlow" class="h-6 dark:invert" />
            } @else {
              <h1 class="truncate text-lg font-semibold text-gray-800 dark:text-gray-100" [title]="mobileBreadcrumb()">{{ mobileBreadcrumb() }}</h1>
            }
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button
              (click)="showQuickNote.set(true)"
              class="rounded-md bg-accent-600 p-1.5 text-white hover:bg-accent-700"
              title="Quick Note"
            >
              <fa-icon [icon]="faPlus" size="sm" />
            </button>
            <button
              (click)="toggleMobileSearch()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-accent-500]="mobilePanel() === 'search'"
              [class.dark:text-accent-400]="mobilePanel() === 'search'"
              title="Search"
            >
              <fa-icon [icon]="faMagnifyingGlass" size="sm" />
            </button>
            <!-- Overflow menu -->
            <div class="relative">
              <button
                (click)="mobileMenuOpen.set(!mobileMenuOpen())"
                class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="More"
              >
                <fa-icon [icon]="faEllipsisVertical" size="sm" />
              </button>
              @if (mobileMenuOpen()) {
                <div (click)="mobileMenuOpen.set(false)" class="fixed inset-0 z-40"></div>
                <div class="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                  <button (click)="toggleMobileFavorites(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faStar" class="w-4 text-center" size="sm" />Favorites
                  </button>
                  <button (click)="toggleMobileShared(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faShareNodes" class="w-4 text-center" size="sm" />Shared
                  </button>
                  <button (click)="toggleMobileTags(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faTags" class="w-4 text-center" size="sm" />Tags
                  </button>
                  <button (click)="toggleMobileArchive(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faBoxArchive" class="w-4 text-center" size="sm" />Archive
                  </button>
                  <button (click)="toggleMobileRecycleBin(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faTrashCan" class="w-4 text-center" size="sm" />Recycle Bin
                  </button>
                  <div class="my-1 border-t border-gray-200 dark:border-gray-600"></div>
                  <button (click)="pomo.toggle(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faUserClock" class="w-4 text-center" size="sm" />Pomodoro
                  </button>
                  @if (pwa.canInstall()) {
                    <button (click)="pwa.promptInstall(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                      <fa-icon [icon]="faCloudArrowDown" class="w-4 text-center" size="sm" />Install App
                    </button>
                  }
                  <button (click)="showSettings.set(true); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faGear" class="w-4 text-center" size="sm" />Settings
                  </button>
                  <button (click)="theme.toggle(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="theme.darkMode() ? faSun : faMoon" class="w-4 text-center" size="sm" />{{ theme.darkMode() ? 'Light mode' : 'Dark mode' }}
                  </button>
                  <button (click)="helpOpen.set(true); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faCircleQuestion" class="w-4 text-center" size="sm" />Help
                  </button>
                  <div class="my-1 border-t border-gray-200 dark:border-gray-600"></div>
                  <button (click)="onLogout(); mobileMenuOpen.set(false)" class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700">
                    <fa-icon [icon]="faArrowRightFromBracket" class="w-4 text-center" size="sm" />Sign out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>
      }

      <!-- ── Main content ────────────────────────────────────── -->
      @if (vp.isDesktop()) {
        <!-- Desktop: nav-rail + panels -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Navigation rail -->
          @if (!editorFullscreen()) {
            <app-nav-rail [mode]="shellMode()" (modeChange)="onModeChange($event)" />
          }

          @if (shellMode() === 'favorites' && !editorFullscreen()) {
            <!-- Favorites panel -->
            <aside class="flex w-96 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <app-favorites-panel (resultClicked)="onFavoriteClicked($event)" />
            </aside>
          } @else if (shellMode() === 'shared' && !editorFullscreen()) {
            <!-- Shared panel -->
            <aside class="flex w-96 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <app-shared-panel (resultClicked)="onSharedClicked($event)" />
            </aside>
          } @else if (shellMode() === 'tags' && !editorFullscreen()) {
            <!-- Tags panel -->
            <aside class="flex w-96 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <app-tags-panel (resultClicked)="onTagNoteClicked($event)" />
            </aside>
          } @else if (shellMode() === 'search' && !editorFullscreen()) {
            <!-- Search panel (replaces notebook + section panels) -->
            <aside class="flex w-96 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <app-search-panel (resultClicked)="onSearchResultClicked($event)" />
            </aside>
          } @else if (shellMode() === 'archive' && !editorFullscreen()) {
            <!-- Archive panel -->
            <aside class="flex w-96 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <app-archive-panel />
            </aside>
          } @else if (shellMode() === 'recycle-bin' && !editorFullscreen()) {
            <!-- Recycle bin panel -->
            <aside class="flex w-96 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <app-recycle-bin-panel />
            </aside>
          } @else {
            <!-- Tree panel -->
            @if (!editorFullscreen()) {
              @if (treeCollapsed()) {
                <div class="flex w-8 flex-col items-center border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <button
                    (click)="treeCollapsed.set(false)"
                    class="mt-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Expand tree"
                  >
                    <fa-icon [icon]="faChevronRight" size="xs" />
                  </button>
                </div>
              } @else {
                <aside class="flex min-h-0 w-72 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <app-note-tree (collapse)="treeCollapsed.set(true)" />
                </aside>
              }
            }
          }

          <!-- Main area: Notes + Editor -->
          <main class="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-800">
            <app-note-area [fullscreen]="editorFullscreen()" (toggleFullscreen)="editorFullscreen.set(!editorFullscreen())" />
          </main>

          @if (helpOpen() && !editorFullscreen()) {
            <aside class="flex w-96 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <app-help-panel (close)="helpOpen.set(false)" (releaseNotes)="showReleaseNotes.set(true)" />
            </aside>
          }
        </div>
      } @else {
        <!-- Compact: single-panel drill-down -->
        <div class="flex flex-1 overflow-hidden">
          @switch (mobilePanel()) {
            @case ('notebooks') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-notebook-list [mobileMode]="true" />
              </div>
            }
            @case ('sections') {
              <div class="flex min-h-0 w-full flex-col bg-white dark:bg-gray-800">
                <app-section-list [mobileMode]="true" />
              </div>
            }
            @case ('notes') {
              <main class="flex min-h-0 min-w-0 w-full flex-col bg-white dark:bg-gray-800">
                <app-note-area [mobileMode]="true" [showEditorOnly]="false" />
              </main>
            }
            @case ('editor') {
              <main class="flex min-h-0 min-w-0 w-full flex-col bg-white dark:bg-gray-800">
                <app-note-area [mobileMode]="true" [showEditorOnly]="true" />
              </main>
            }
            @case ('search') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-search-panel (resultClicked)="onMobileSearchResultClicked($event)" />
              </div>
            }
            @case ('archive') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-archive-panel />
              </div>
            }
            @case ('favorites') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-favorites-panel (resultClicked)="onMobileFavoriteClicked($event)" />
              </div>
            }
            @case ('shared') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-shared-panel (resultClicked)="onMobileSharedClicked($event)" />
              </div>
            }
            @case ('tags') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-tags-panel (resultClicked)="onMobileTagNoteClicked($event)" />
              </div>
            }
            @case ('recycle-bin') {
              <div class="flex min-h-0 w-full flex-col bg-gray-50 dark:bg-gray-900">
                <app-recycle-bin-panel />
              </div>
            }
          }
        </div>

        <!-- Help modal for compact viewports -->
        <app-modal [open]="helpOpen()" title="Help" (closed)="helpOpen.set(false)">
          <app-help-panel [asContent]="true" (close)="helpOpen.set(false)" (releaseNotes)="showReleaseNotes.set(true)" />
        </app-modal>
      }

      <!-- ── Footer ──────────────────────────────────────────── -->
      @if (vp.isDesktop() || mobilePanel() !== 'editor') {
        <footer class="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 border-t border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-500 sm:h-8 sm:justify-start sm:py-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <span>&copy; {{ currentYear }} Jonathan T. Poltorak</span>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button (click)="showReleaseNotes.set(true)" class="hover:text-gray-700 dark:hover:text-gray-200">v{{ appVersion }}</button>
          <span class="hidden text-gray-300 sm:inline dark:text-gray-600">|</span>
          <button (click)="showAbout.set(true)" class="hover:text-gray-700 dark:hover:text-gray-200">About</button>
          <span class="hidden text-gray-300 sm:inline dark:text-gray-600">|</span>
          <button (click)="showFeedback.set(true)" class="hover:text-gray-700 dark:hover:text-gray-200">Feedback</button>
          <span class="hidden text-gray-300 sm:inline dark:text-gray-600">|</span>
          <button (click)="openLegal('terms')" class="hover:text-gray-700 dark:hover:text-gray-200">Terms</button>
          <span class="hidden text-gray-300 sm:inline dark:text-gray-600">|</span>
          <button (click)="openLegal('privacy')" class="hover:text-gray-700 dark:hover:text-gray-200">Privacy</button>
          <span class="hidden text-gray-300 sm:inline dark:text-gray-600">|</span>
          <button (click)="openLegal('disclaimer')" class="hover:text-gray-700 dark:hover:text-gray-200">Disclaimer</button>
        </footer>
      }
    </div>

    @if (pomo.isVisible()) {
      <app-pomodoro-timer />
    }

    <app-about-dialog [open]="showAbout()" (closed)="showAbout.set(false)" />
    <app-feedback-dialog [open]="showFeedback()" (closed)="showFeedback.set(false)" />
    <app-legal-dialog [open]="showLegal()" [section]="legalSection()" [title]="legalTitle()" (closed)="showLegal.set(false)" />
    <app-settings-dialog [open]="showSettings()" (closed)="showSettings.set(false)" />
    <app-quick-note-dialog [open]="showQuickNote()" (closed)="showQuickNote.set(false)" (created)="onQuickNoteCreated($event)" />
    <app-release-notes-dialog [open]="showReleaseNotes()" (closed)="showReleaseNotes.set(false)" />
    <app-toast-container />
  `,
})
export class Shell implements OnInit {
  protected auth = inject(AuthService);
  protected theme = inject(ThemeService);
  protected vp = inject(ViewportService);
  protected pwa = inject(PwaService);
  protected pwaUpdate = inject(PwaUpdateService);
  private state = inject(ShellStateService);
  private treeState = inject(TreeStateService);
  protected pomo = inject(PomodoroService);

  protected faMoon = faMoon;
  protected faSun = faSun;
  protected faChevronRight = faChevronRight;
  protected faChevronLeft = faChevronLeft;
  protected faCircleQuestion = faCircleQuestion;
  protected faMagnifyingGlass = faMagnifyingGlass;
  protected faBoxArchive = faBoxArchive;
  protected faStar = faStar;
  protected faShareNodes = faShareNodes;
  protected faTags = faTags;
  protected faGear = faGear;
  protected faPlus = faPlus;
  protected faCloudArrowDown = faCloudArrowDown;
  protected faArrowRightFromBracket = faArrowRightFromBracket;
  protected faTrashCan = faTrashCan;
  protected faUserClock = faUserClock;
  protected faEllipsisVertical = faEllipsisVertical;

  // Desktop panel state
  protected treeCollapsed = signal(false);
  protected editorFullscreen = signal(false);
  protected shellMode = signal<ShellMode>('favorites');

  // Search panel ref (for clearing on mode switch)
  private searchPanelRef = viewChild(SearchPanel);

  // Shared UI state
  protected helpOpen = signal(false);
  protected showAbout = signal(false);
  protected showFeedback = signal(false);
  protected showSettings = signal(false);
  protected showQuickNote = signal(false);
  protected showReleaseNotes = signal(false);
  protected showLegal = signal(false);
  protected legalSection = signal<'terms' | 'privacy' | 'disclaimer'>('terms');
  protected legalTitle = computed(() => {
    switch (this.legalSection()) {
      case 'terms': return 'Terms of Use';
      case 'privacy': return 'Privacy Policy';
      case 'disclaimer': return 'Disclaimer';
    }
  });
  protected currentYear = new Date().getFullYear();
  protected appVersion = APP_VERSION;
  protected closureDeletionDate = computed(() => {
    const deleteRequestedAt = this.auth.user()?.deleteRequestedAt;
    if (!deleteRequestedAt) return '';
    const d = new Date(deleteRequestedAt);
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  });

  // ── Mobile navigation ─────────────────────────────────────────
  protected mobileMenuOpen = signal(false);
  protected mobilePanel = signal<MobilePanel>('notebooks');
  private cameFromSearch = false;

  protected mobileBreadcrumb = computed(() => {
    switch (this.mobilePanel()) {
      case 'notebooks':
        return 'NoteFlow';
      case 'sections':
        return this.state.selectedNotebook()?.title ?? 'Sections';
      case 'notes':
        return this.state.selectedSection()?.title ?? 'Notes';
      case 'editor':
        return this.state.selectedNote()?.title ?? 'Editor';
      case 'search':
        return 'Search';
      case 'archive':
        return 'Archive';
      case 'favorites':
        return 'Favorites';
      case 'shared':
        return 'Shared';
      case 'tags':
        return 'Tags';
      case 'recycle-bin':
        return 'Recycle Bin';
    }
  });

  constructor() {
    // Auto-advance mobile panel when selections change on compact viewports
    effect(() => {
      if (!this.vp.isCompact()) return;
      // Skip auto-advance when in search/archive/favorites/shared/tags/recycle-bin mode — they handle navigation themselves
      if (this.mobilePanel() === 'search' || this.mobilePanel() === 'archive' || this.mobilePanel() === 'favorites' || this.mobilePanel() === 'shared' || this.mobilePanel() === 'tags' || this.mobilePanel() === 'recycle-bin') return;
      if (this.cameFromSearch) return;

      const nbId = this.state.selectedNotebookId();
      const secId = this.state.selectedSectionId();
      const noteId = this.state.selectedNoteId();

      if (noteId) {
        this.mobilePanel.set('editor');
      } else if (secId) {
        this.mobilePanel.set('notes');
      } else if (nbId) {
        this.mobilePanel.set('sections');
      } else {
        this.mobilePanel.set('notebooks');
      }
    });
  }

  ngOnInit(): void {
    this.state.loadNotebooks();
  }

  onLogout(): void {
    this.auth.logout().subscribe();
  }

  protected onReactivate(): void {
    this.auth.reactivateAccount().subscribe();
  }

  protected onQuickNoteCreated(result: QuickNoteResult): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.treeState.expandToNote(result.notebookId, result.sectionId);
    this.shellMode.set('notes');
    if (this.vp.isCompact()) {
      this.cameFromSearch = true;
      this.mobilePanel.set('editor');
      setTimeout(() => (this.cameFromSearch = false));
    }
  }

  protected openLegal(section: 'terms' | 'privacy' | 'disclaimer'): void {
    this.legalSection.set(section);
    this.showLegal.set(true);
  }

  // ── Desktop search ──────────────────────────────────────────────

  protected onModeChange(mode: ShellMode): void {
    this.shellMode.set(mode);
    if (mode !== 'search') {
      this.searchPanelRef()?.clear();
    }
  }

  protected onSearchResultClicked(result: SearchResultDto): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.treeState.expandToNote(result.notebookId, result.sectionId);
    this.searchPanelRef()?.setSelectedNoteId(result.noteId);
  }

  // ── Desktop favorites ───────────────────────────────────────────

  protected onFavoriteClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.treeState.expandToNote(result.notebookId, result.sectionId);
    this.shellMode.set('notes');
  }

  // ── Desktop tags ────────────────────────────────────────────────

  protected onTagNoteClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.treeState.expandToNote(result.notebookId, result.sectionId);
    this.shellMode.set('notes');
  }

  // ── Desktop shared ──────────────────────────────────────────────

  protected onSharedClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.treeState.expandToNote(result.notebookId, result.sectionId);
    this.shellMode.set('notes');
  }

  // ── Mobile favorites ──────────────────────────────────────────

  protected onMobileFavoriteClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.cameFromSearch = true;
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.mobilePanel.set('editor');
    setTimeout(() => (this.cameFromSearch = false));
  }

  // ── Mobile search ───────────────────────────────────────────────

  protected toggleMobileSearch(): void {
    if (this.mobilePanel() === 'search') {
      this.mobilePanel.set('notebooks');
    } else {
      this.mobilePanel.set('search');
    }
  }

  protected toggleMobileFavorites(): void {
    if (this.mobilePanel() === 'favorites') {
      this.mobilePanel.set('notebooks');
    } else {
      this.mobilePanel.set('favorites');
    }
  }

  protected toggleMobileShared(): void {
    if (this.mobilePanel() === 'shared') {
      this.mobilePanel.set('notebooks');
    } else {
      this.mobilePanel.set('shared');
    }
  }

  protected onMobileSharedClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.cameFromSearch = true;
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.mobilePanel.set('editor');
    setTimeout(() => (this.cameFromSearch = false));
  }

  protected toggleMobileTags(): void {
    if (this.mobilePanel() === 'tags') {
      this.mobilePanel.set('notebooks');
    } else {
      this.mobilePanel.set('tags');
    }
  }

  protected onMobileTagNoteClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.cameFromSearch = true;
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.mobilePanel.set('editor');
    setTimeout(() => (this.cameFromSearch = false));
  }

  protected toggleMobileArchive(): void {
    if (this.mobilePanel() === 'archive') {
      this.mobilePanel.set('notebooks');
    } else {
      this.mobilePanel.set('archive');
    }
  }

  protected toggleMobileRecycleBin(): void {
    if (this.mobilePanel() === 'recycle-bin') {
      this.mobilePanel.set('notebooks');
    } else {
      this.mobilePanel.set('recycle-bin');
    }
  }

  protected onMobileSearchResultClicked(result: SearchResultDto): void {
    this.cameFromSearch = true;
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.mobilePanel.set('editor');
    // Reset flag after effect cycle
    setTimeout(() => (this.cameFromSearch = false));
  }

  // ── Mobile navigation ───────────────────────────────────────────

  protected goBack(): void {
    switch (this.mobilePanel()) {
      case 'editor':
        if (this.cameFromSearch) {
          this.mobilePanel.set('search');
          return;
        }
        this.state.selectedNoteId.set(null);
        this.mobilePanel.set('notes');
        break;
      case 'notes':
        this.state.selectedSectionId.set(null);
        this.state.selectedNoteId.set(null);
        this.mobilePanel.set('sections');
        break;
      case 'sections':
        this.state.selectedNotebookId.set(null);
        this.state.selectedSectionId.set(null);
        this.state.selectedNoteId.set(null);
        this.state.sections.set([]);
        this.state.notes.set([]);
        this.mobilePanel.set('notebooks');
        break;
      case 'search':
        this.mobilePanel.set('notebooks');
        break;
      case 'archive':
        this.mobilePanel.set('notebooks');
        break;
      case 'favorites':
        this.mobilePanel.set('notebooks');
        break;
      case 'shared':
        this.mobilePanel.set('notebooks');
        break;
      case 'tags':
        this.mobilePanel.set('notebooks');
        break;
      case 'recycle-bin':
        this.mobilePanel.set('notebooks');
        break;
    }
  }
}
