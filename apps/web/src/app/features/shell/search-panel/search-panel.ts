import {
  Component,
  computed,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { SearchService } from '../../../core/services/search.service';
import type { SearchResultDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-search-panel',
  imports: [FaIconComponent],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    <div class="flex h-full flex-col">
      <!-- Search input -->
      <div class="border-b border-gray-200 p-3 dark:border-gray-700">
        <div class="relative">
          <fa-icon
            [icon]="faMagnifyingGlass"
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            size="sm"
          />
          <input
            #searchInput
            type="text"
            placeholder="Search all notes…"
            (input)="onInput($event)"
            class="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm
                   placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                   dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500
                   dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      <!-- Include archived toggle -->
      <div class="border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
        <label class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            [checked]="includeArchived()"
            (change)="onToggleArchived($event)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          Include archived notes
        </label>
      </div>

      <!-- Results -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        @if (loading()) {
          <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <fa-icon [icon]="faSpinner" class="animate-spin" />
            Searching…
          </div>
        } @else if (query() && results().length === 0) {
          <p class="py-8 text-center text-sm text-gray-400">No results found</p>
        } @else if (!query()) {
          <p class="py-8 text-center text-sm text-gray-400">Type to search across all notes</p>
        } @else {
          <p class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            {{ resultSummary() }}
          </p>
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (r of results(); track r.noteId) {
              <li>
                <button
                  (click)="onResultClick(r)"
                  class="w-full px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  [class.bg-blue-50]="selectedNoteId() === r.noteId"
                  [class.dark:bg-blue-900/20]="selectedNoteId() === r.noteId"
                >
                  <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="r.noteTitle">
                    {{ r.noteTitle }}
                    @if (r.archivedAt) {
                      <span class="ml-1 rounded bg-gray-200 px-1 py-0.5 text-xs text-gray-500 dark:bg-gray-600 dark:text-gray-400">(archived)</span>
                    }
                  </p>
                  <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ r.notebookTitle }} &rsaquo; {{ r.sectionTitle }}
                  </p>
                  @if (r.snippet) {
                    <p class="mt-0.5 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">
                      {{ r.snippet }}
                    </p>
                  }
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class SearchPanel implements OnInit, OnDestroy {
  resultClicked = output<SearchResultDto>();

  protected faMagnifyingGlass = faMagnifyingGlass;
  protected faSpinner = faSpinner;

  protected query = signal('');
  protected results = signal<SearchResultDto[]>([]);
  protected loading = signal(false);
  protected selectedNoteId = signal<number | null>(null);
  protected includeArchived = signal(false);

  protected resultSummary = computed(() => {
    const r = this.results();
    const count = r.length;
    const notebooks = new Set(r.map((x) => x.notebookId)).size;
    const noteWord = count === 1 ? 'result' : 'results';
    const nbWord = notebooks === 1 ? 'notebook' : 'notebooks';
    return `${count} ${noteWord} across ${notebooks} ${nbWord}.`;
  });

  private searchSvc = inject(SearchService);
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private query$ = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q.trim()) {
            this.loading.set(false);
            return of([]);
          }
          this.loading.set(true);
          return this.searchSvc.search(q, this.includeArchived());
        }),
      )
      .subscribe({
        next: (results) => {
          this.results.set(results);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    // Auto-focus the input on mount
    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    if (value.trim()) {
      this.loading.set(true);
    }
    this.query$.next(value);
  }

  protected onToggleArchived(event: Event): void {
    this.includeArchived.set((event.target as HTMLInputElement).checked);
    // Re-trigger search with current query
    const q = this.query();
    if (q.trim()) {
      this.loading.set(true);
      this.query$.next(q);
    }
  }

  protected onResultClick(result: SearchResultDto): void {
    this.selectedNoteId.set(result.noteId);
    this.resultClicked.emit(result);
  }

  /** Clear search state — called by parent when leaving search mode. */
  clear(): void {
    this.query.set('');
    this.results.set([]);
    this.selectedNoteId.set(null);
    this.includeArchived.set(false);
    const input = this.searchInput()?.nativeElement;
    if (input) input.value = '';
  }

  /** Highlight a specific note in the results list. */
  setSelectedNoteId(id: number | null): void {
    this.selectedNoteId.set(id);
  }
}
