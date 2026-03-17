import { Component, ElementRef, OnInit, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGlobe, faStickyNote, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { SearchService } from '../../../core/services/search.service';
import type { SearchResultDto } from '@noteflow/shared-types';

export type LinkPopoverResult =
  | { type: 'url'; url: string }
  | { type: 'note'; result: SearchResultDto };

@Component({
  selector: 'app-link-popover',
  imports: [FaIconComponent],
  template: `
    <div
      class="fixed z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
      [style.top.px]="position().top"
      [style.left.px]="position().left"
      (mousedown)="$event.preventDefault()"
    >
      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          (click)="mode.set('url')"
          class="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
          [class]="mode() === 'url'
            ? 'border-b-2 border-accent-500 text-accent-600 dark:text-accent-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
        >
          <fa-icon [icon]="faGlobe" size="xs" />
          URL
        </button>
        <button
          (click)="mode.set('note')"
          class="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
          [class]="mode() === 'note'
            ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
        >
          <fa-icon [icon]="faStickyNote" size="xs" />
          Note
        </button>
      </div>

      @if (mode() === 'url') {
        <!-- URL input -->
        <div class="p-2">
          <input
            #urlInput
            type="text"
            [value]="urlValue()"
            (input)="urlValue.set($any($event.target).value)"
            (keydown)="onUrlKeyDown($event)"
            class="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="https://..."
          />
          <div class="mt-1.5 flex justify-end gap-1.5">
            <button
              (click)="dismissed.emit()"
              class="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >Cancel</button>
            <button
              (click)="submitUrl()"
              [disabled]="!urlValue().trim()"
              class="rounded bg-accent-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-700 disabled:opacity-40"
            >Apply</button>
          </div>
        </div>
      } @else {
        <!-- Note search -->
        <div class="border-b border-gray-200 px-2 py-1.5 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <fa-icon [icon]="faMagnifyingGlass" class="text-gray-400" size="xs" />
            <input
              #noteSearchInput
              type="text"
              [value]="noteQuery()"
              (input)="onNoteQueryChange($any($event.target).value)"
              (keydown)="onNoteKeyDown($event)"
              class="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500"
              placeholder="Search notes..."
            />
          </div>
        </div>
        <div class="max-h-40 overflow-y-auto">
          @if (noteLoading()) {
            <div class="px-3 py-2 text-xs text-gray-400">Searching...</div>
          } @else if (noteResults().length === 0 && noteQuery()) {
            <div class="px-3 py-2 text-xs text-gray-400">No notes found</div>
          } @else if (noteResults().length === 0) {
            <div class="px-3 py-2 text-xs text-gray-400">Type to search for a note</div>
          } @else {
            @for (result of noteResults(); track result.noteId; let i = $index) {
              <button
                class="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors"
                [class.bg-purple-50]="i === noteSelectedIndex()"
                [class.dark:bg-purple-900]="i === noteSelectedIndex()"
                [class.hover:bg-gray-50]="i !== noteSelectedIndex()"
                [class.dark:hover:bg-gray-700]="i !== noteSelectedIndex()"
                (mouseenter)="noteSelectedIndex.set(i)"
                (click)="selectNote(result)"
              >
                <fa-icon [icon]="faStickyNote" class="shrink-0 text-purple-400" size="sm" />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm text-gray-800 dark:text-gray-100">{{ result.noteTitle }}</div>
                  <div class="truncate text-[11px] text-gray-400 dark:text-gray-500">{{ result.notebookTitle }} / {{ result.sectionTitle }}</div>
                </div>
              </button>
            }
          }
        </div>
      }
    </div>
  `,
})
export class LinkPopover implements OnInit {
  position = input<{ top: number; left: number }>({ top: 0, left: 0 });
  currentUrl = input('');
  selected = output<LinkPopoverResult>();
  dismissed = output<void>();

  private searchService = inject(SearchService);
  private urlInputRef = viewChild<ElementRef<HTMLInputElement>>('urlInput');
  private noteSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('noteSearchInput');

  protected faGlobe = faGlobe;
  protected faStickyNote = faStickyNote;
  protected faMagnifyingGlass = faMagnifyingGlass;

  protected mode = signal<'url' | 'note'>('url');
  protected urlValue = signal('');

  // Note search state
  protected noteQuery = signal('');
  protected noteResults = signal<SearchResultDto[]>([]);
  protected noteLoading = signal(false);
  protected noteSelectedIndex = signal(0);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Focus the appropriate input when mode changes
    effect(() => {
      const m = this.mode();
      setTimeout(() => {
        if (m === 'url') this.urlInputRef()?.nativeElement.focus();
        else this.noteSearchInputRef()?.nativeElement.focus();
      });
    });
  }

  ngOnInit(): void {
    this.urlValue.set(this.currentUrl());
    setTimeout(() => this.urlInputRef()?.nativeElement.focus());
  }

  // ── URL mode ─────────────────────────────────────────────

  protected onUrlKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitUrl();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.dismissed.emit();
    }
  }

  protected submitUrl(): void {
    const url = this.urlValue().trim();
    if (!url) return;
    this.selected.emit({ type: 'url', url });
  }

  // ── Note mode ────────────────────────────────────────────

  protected onNoteQueryChange(value: string): void {
    this.noteQuery.set(value);
    this.noteSelectedIndex.set(0);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (!value.trim()) {
      this.noteResults.set([]);
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.noteLoading.set(true);
      this.searchService.search(value).subscribe({
        next: (results) => {
          this.noteResults.set(results);
          this.noteSelectedIndex.set(0);
          this.noteLoading.set(false);
        },
        error: () => {
          this.noteResults.set([]);
          this.noteLoading.set(false);
        },
      });
    }, 200);
  }

  protected onNoteKeyDown(event: KeyboardEvent): void {
    const results = this.noteResults();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) {
        this.noteSelectedIndex.set((this.noteSelectedIndex() + 1) % results.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) {
        this.noteSelectedIndex.set((this.noteSelectedIndex() - 1 + results.length) % results.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results.length > 0) {
        this.selectNote(results[this.noteSelectedIndex()]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.dismissed.emit();
    }
  }

  protected selectNote(result: SearchResultDto): void {
    this.selected.emit({ type: 'note', result });
  }
}
