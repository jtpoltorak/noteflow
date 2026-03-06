import { Component, computed, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faCircleQuestion, faCommentDots, faMoon, faSun, faChevronRight, faChevronLeft, faMagnifyingGlass, faBoxArchive, faStar, faShareNodes, faTags } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ViewportService } from '../../core/services/viewport.service';
import { ShellStateService } from './shell-state.service';
import { NotebookList } from './notebook-list/notebook-list';
import { SectionList } from './section-list/section-list';
import { NoteArea } from './note-area/note-area';
import { AboutDialog } from '../../shared/about-dialog/about-dialog';
import { FeedbackDialog } from '../../shared/feedback-dialog/feedback-dialog';
import { LegalDialog } from '../../shared/legal-dialog/legal-dialog';
import { HelpPanel } from './help-panel/help-panel';
import { Modal } from '../../shared/modal/modal';
import { NavRail, type ShellMode } from './nav-rail/nav-rail';
import { SearchPanel } from './search-panel/search-panel';
import { ArchivePanel } from './archive-panel/archive-panel';
import { FavoritesPanel } from './favorites-panel/favorites-panel';
import { SharedPanel } from './shared-panel/shared-panel';
import { TagsPanel } from './tags-panel/tags-panel';
import type { SearchResultDto } from '@noteflow/shared-types';

export type MobilePanel = 'notebooks' | 'sections' | 'notes' | 'editor' | 'search' | 'archive' | 'favorites' | 'shared' | 'tags';

@Component({
  selector: 'app-shell',
  imports: [NotebookList, SectionList, NoteArea, FaIconComponent, AboutDialog, FeedbackDialog, LegalDialog, HelpPanel, Modal, NavRail, SearchPanel, ArchivePanel, FavoritesPanel, SharedPanel, TagsPanel],
  providers: [ShellStateService],
  template: `
    <div class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">

      <!-- ── Header ──────────────────────────────────────────── -->
      @if (vp.isDesktop()) {
        <header class="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          <img src="noteflow-logo.svg" alt="NoteFlow" class="h-7 dark:invert" />
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
      } @else {
        <!-- Compact header -->
        <header class="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
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
          <div class="flex shrink-0 items-center gap-2">
            <button
              (click)="toggleMobileFavorites()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-blue-500]="mobilePanel() === 'favorites'"
              [class.dark:text-blue-400]="mobilePanel() === 'favorites'"
              title="Favorites"
            >
              <fa-icon [icon]="faStar" size="sm" />
            </button>
            <button
              (click)="toggleMobileShared()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-blue-500]="mobilePanel() === 'shared'"
              [class.dark:text-blue-400]="mobilePanel() === 'shared'"
              title="Shared"
            >
              <fa-icon [icon]="faShareNodes" size="sm" />
            </button>
            <button
              (click)="toggleMobileTags()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-blue-500]="mobilePanel() === 'tags'"
              [class.dark:text-blue-400]="mobilePanel() === 'tags'"
              title="Tags"
            >
              <fa-icon [icon]="faTags" size="sm" />
            </button>
            <button
              (click)="toggleMobileSearch()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-blue-500]="mobilePanel() === 'search'"
              [class.dark:text-blue-400]="mobilePanel() === 'search'"
              title="Search"
            >
              <fa-icon [icon]="faMagnifyingGlass" size="sm" />
            </button>
            <button
              (click)="toggleMobileArchive()"
              class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [class.text-blue-500]="mobilePanel() === 'archive'"
              [class.dark:text-blue-400]="mobilePanel() === 'archive'"
              title="Archive"
            >
              <fa-icon [icon]="faBoxArchive" size="sm" />
            </button>
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
              class="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Sign out
            </button>
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
          } @else {
            <!-- Left panel: Notebooks -->
            @if (!editorFullscreen()) {
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
            }

            <!-- Middle panel: Sections -->
            @if (!editorFullscreen()) {
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
            }
          }

          <!-- Main area: Notes + Editor -->
          <main class="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-gray-800">
            <app-note-area [collapsed]="notesCollapsed()" [hideNotesList]="shellMode() === 'search'" [fullscreen]="editorFullscreen()" (toggleCollapsed)="notesCollapsed.set(!notesCollapsed())" (toggleFullscreen)="editorFullscreen.set(!editorFullscreen())" />
          </main>

          @if (helpOpen() && !editorFullscreen()) {
            <aside class="flex w-80 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <app-help-panel (close)="helpOpen.set(false)" />
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
          }
        </div>

        <!-- Help modal for compact viewports -->
        <app-modal [open]="helpOpen()" title="Help" (closed)="helpOpen.set(false)">
          <app-help-panel [asContent]="true" (close)="helpOpen.set(false)" />
        </app-modal>
      }

      <!-- ── Footer ──────────────────────────────────────────── -->
      @if (vp.isDesktop() || mobilePanel() !== 'editor') {
        <footer class="flex h-8 items-center gap-3 border-t border-gray-200 bg-white px-4 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <span>&copy; {{ currentYear }} Jonathan T. Poltorak</span>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button (click)="showAbout.set(true)" class="inline-flex cursor-pointer items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
            <fa-icon [icon]="faCircleInfo" size="xs" />
            About
          </button>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button (click)="showFeedback.set(true)" class="inline-flex cursor-pointer items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
            <fa-icon [icon]="faCommentDots" size="xs" />
            Feedback
          </button>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button (click)="openLegal('terms')" class="hover:text-gray-700 dark:hover:text-gray-200">Terms</button>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button (click)="openLegal('privacy')" class="hover:text-gray-700 dark:hover:text-gray-200">Privacy</button>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <button (click)="openLegal('disclaimer')" class="hover:text-gray-700 dark:hover:text-gray-200">Disclaimer</button>
        </footer>
      }
    </div>

    <app-about-dialog [open]="showAbout()" (closed)="showAbout.set(false)" />
    <app-feedback-dialog [open]="showFeedback()" (closed)="showFeedback.set(false)" />
    <app-legal-dialog [open]="showLegal()" [section]="legalSection()" [title]="legalTitle()" (closed)="showLegal.set(false)" />
  `,
})
export class Shell implements OnInit {
  protected auth = inject(AuthService);
  protected theme = inject(ThemeService);
  protected vp = inject(ViewportService);
  private state = inject(ShellStateService);

  protected faMoon = faMoon;
  protected faSun = faSun;
  protected faCircleInfo = faCircleInfo;
  protected faCommentDots = faCommentDots;
  protected faChevronRight = faChevronRight;
  protected faChevronLeft = faChevronLeft;
  protected faCircleQuestion = faCircleQuestion;
  protected faMagnifyingGlass = faMagnifyingGlass;
  protected faBoxArchive = faBoxArchive;
  protected faStar = faStar;
  protected faShareNodes = faShareNodes;
  protected faTags = faTags;

  // Desktop panel state
  protected notebooksCollapsed = signal(false);
  protected sectionsCollapsed = signal(false);
  protected notesCollapsed = signal(false);
  protected editorFullscreen = signal(false);
  protected shellMode = signal<ShellMode>('favorites');

  // Search panel ref (for clearing on mode switch)
  private searchPanelRef = viewChild(SearchPanel);

  // Shared UI state
  protected helpOpen = signal(false);
  protected showAbout = signal(false);
  protected showFeedback = signal(false);
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

  // ── Mobile navigation ─────────────────────────────────────────
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
    }
  });

  constructor() {
    // Auto-advance mobile panel when selections change on compact viewports
    effect(() => {
      if (!this.vp.isCompact()) return;
      // Skip auto-advance when in search/archive/favorites/shared/tags mode — they handle navigation themselves
      if (this.mobilePanel() === 'search' || this.mobilePanel() === 'archive' || this.mobilePanel() === 'favorites' || this.mobilePanel() === 'shared' || this.mobilePanel() === 'tags') return;
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
    this.searchPanelRef()?.setSelectedNoteId(result.noteId);
  }

  // ── Desktop favorites ───────────────────────────────────────────

  protected onFavoriteClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.shellMode.set('notes');
  }

  // ── Desktop tags ────────────────────────────────────────────────

  protected onTagNoteClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
    this.shellMode.set('notes');
  }

  // ── Desktop shared ──────────────────────────────────────────────

  protected onSharedClicked(result: { notebookId: number; sectionId: number; noteId: number }): void {
    this.state.selectNoteFromSearch(result.notebookId, result.sectionId, result.noteId);
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
    }
  }
}
