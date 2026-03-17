import { Component, effect, inject, input, output, signal, ElementRef, viewChild, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { SearchService } from '../../../core/services/search.service';
import type { SearchResultDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-note-link-picker',
  imports: [FaIconComponent],
  template: `
    <div
      class="fixed z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
      [style.top.px]="position().top"
      [style.left.px]="position().left"
    >
      <div class="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <fa-icon [icon]="faMagnifyingGlass" class="text-gray-400" size="sm" />
        <input
          #searchInput
          type="text"
          [value]="query()"
          (input)="onQueryChange($any($event.target).value)"
          (keydown)="onKeyDown($event)"
          class="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500"
          placeholder="Search notes..."
        />
      </div>
      <div class="max-h-48 overflow-y-auto">
        @if (loading()) {
          <div class="px-3 py-2 text-xs text-gray-400">Searching...</div>
        } @else if (results().length === 0 && query()) {
          <div class="px-3 py-2 text-xs text-gray-400">No notes found</div>
        } @else {
          @for (result of results(); track result.noteId; let i = $index) {
            <button
              class="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors"
              [class.bg-accent-50]="i === selectedIndex()"
              [class.dark:bg-accent-900]="i === selectedIndex()"
              [class.hover:bg-gray-50]="i !== selectedIndex()"
              [class.dark:hover:bg-gray-700]="i !== selectedIndex()"
              (mousedown)="$event.preventDefault()"
              (mouseenter)="selectedIndex.set(i)"
              (click)="selectResult(result)"
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
    </div>
  `,
})
export class NoteLinkPicker implements OnInit {
  position = input<{ top: number; left: number }>({ top: 0, left: 0 });
  initialQuery = input('');
  selected = output<SearchResultDto>();
  dismissed = output<void>();

  private searchService = inject(SearchService);
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected faStickyNote = faStickyNote;
  protected faMagnifyingGlass = faMagnifyingGlass;

  protected query = signal('');
  protected results = signal<SearchResultDto[]>([]);
  protected loading = signal(false);
  protected selectedIndex = signal(0);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const q = this.initialQuery();
      if (q) {
        this.query.set(q);
        this.doSearch(q);
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.selectedIndex.set(0);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (!value.trim()) {
      this.results.set([]);
      return;
    }

    this.debounceTimer = setTimeout(() => this.doSearch(value), 200);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const results = this.results();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) {
        this.selectedIndex.set((this.selectedIndex() + 1) % results.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) {
        this.selectedIndex.set((this.selectedIndex() - 1 + results.length) % results.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results.length > 0) {
        this.selectResult(results[this.selectedIndex()]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.dismissed.emit();
    }
  }

  protected selectResult(result: SearchResultDto): void {
    this.selected.emit(result);
  }

  private doSearch(query: string): void {
    this.loading.set(true);
    this.searchService.search(query).subscribe({
      next: (results) => {
        this.results.set(results);
        this.selectedIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }
}
