import { Component, ElementRef, OnDestroy, OnInit, effect, input, output, signal, viewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronUp, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Editor } from '@tiptap/core';
import { getSearchState } from './tiptap-editor/search-replace.extension';

@Component({
  selector: 'app-find-replace-panel',
  imports: [FaIconComponent],
  host: { class: 'block' },
  template: `
    <div
      class="flex flex-col gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      (keydown)="onPanelKeyDown($event)"
    >
      <!-- Find row -->
      <div class="flex items-center gap-1.5">
        <input
          #searchInput
          type="text"
          [value]="searchTerm()"
          (input)="onSearchInput($any($event.target).value)"
          (keydown)="onSearchKeyDown($event)"
          class="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 placeholder-gray-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          placeholder="Find..."
        />

        <span class="min-w-[4rem] text-center text-xs tabular-nums text-gray-400 dark:text-gray-500">
          @if (matchCount() > 0) {
            {{ currentIndex() + 1 }} of {{ matchCount() }}
          } @else if (searchTerm()) {
            No results
          }
        </span>

        <button
          (mousedown)="$event.preventDefault(); findPrevious()"
          class="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          [disabled]="matchCount() === 0"
          title="Previous (Shift+Enter)"
        ><fa-icon [icon]="faChevronUp" size="xs" /></button>

        <button
          (mousedown)="$event.preventDefault(); findNext()"
          class="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
          [disabled]="matchCount() === 0"
          title="Next (Enter)"
        ><fa-icon [icon]="faChevronDown" size="xs" /></button>

        <button
          (mousedown)="$event.preventDefault(); toggleCaseSensitive()"
          class="rounded px-1.5 py-0.5 text-xs font-semibold transition-colors"
          [class]="caseSensitive()
            ? 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300'
            : 'text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-700'"
          title="Case sensitive"
        >Aa</button>

        <button
          (mousedown)="$event.preventDefault(); close()"
          class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Close (Escape)"
        ><fa-icon [icon]="faXmark" size="sm" /></button>
      </div>

      <!-- Replace row -->
      @if (!findOnly()) {
        <div class="flex items-center gap-1.5">
          <input
            #replaceInput
            type="text"
            [value]="replaceTerm()"
            (input)="onReplaceInput($any($event.target).value)"
            (keydown)="onReplaceKeyDown($event)"
            class="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 placeholder-gray-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="Replace..."
          />

          <button
            (mousedown)="$event.preventDefault(); replaceCurrent()"
            class="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-30 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            [disabled]="matchCount() === 0"
          >Replace</button>

          <button
            (mousedown)="$event.preventDefault(); replaceAll()"
            class="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-30 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            [disabled]="matchCount() === 0"
          >All</button>
        </div>
      }
    </div>
  `,
})
export class FindReplacePanel implements OnInit, OnDestroy {
  editor = input.required<Editor>();
  findOnly = input(false);
  closed = output<void>();

  private searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected faChevronUp = faChevronUp;
  protected faChevronDown = faChevronDown;
  protected faXmark = faXmark;

  protected searchTerm = signal('');
  protected replaceTerm = signal('');
  protected caseSensitive = signal(false);
  protected matchCount = signal(0);
  protected currentIndex = signal(-1);

  private updateListener: (() => void) | null = null;

  constructor() {
    // Focus search input when it becomes available
    effect(() => {
      const el = this.searchInputRef();
      if (el) {
        setTimeout(() => el.nativeElement.focus());
      }
    });
  }

  ngOnInit(): void {
    const ed = this.editor();

    // Prefill with selected text
    const { from, to, empty } = ed.state.selection;
    if (!empty) {
      const selectedText = ed.state.doc.textBetween(from, to, ' ');
      if (selectedText.length <= 100) {
        this.searchTerm.set(selectedText);
        ed.commands.setSearchTerm(selectedText);
        this.syncState();
      }
    }

    // Listen for editor updates to keep match count in sync
    this.updateListener = () => this.syncState();
    ed.on('update', this.updateListener);
    ed.on('selectionUpdate', this.updateListener);
  }

  ngOnDestroy(): void {
    const ed = this.editor();
    if (this.updateListener) {
      ed.off('update', this.updateListener);
      ed.off('selectionUpdate', this.updateListener);
    }
    ed.commands.clearSearch();
  }

  private syncState(): void {
    const state = getSearchState(this.editor());
    this.matchCount.set(state.results.length);
    this.currentIndex.set(state.currentIndex);
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.editor().commands.setSearchTerm(value);
    this.syncState();
  }

  protected onReplaceInput(value: string): void {
    this.replaceTerm.set(value);
    this.editor().commands.setReplaceTerm(value);
  }

  protected findNext(): void {
    this.editor().commands.findNext();
    this.syncState();
  }

  protected findPrevious(): void {
    this.editor().commands.findPrevious();
    this.syncState();
  }

  protected toggleCaseSensitive(): void {
    const next = !this.caseSensitive();
    this.caseSensitive.set(next);
    this.editor().commands.setCaseSensitive(next);
    this.syncState();
  }

  protected replaceCurrent(): void {
    this.editor().commands.replaceCurrent();
    // Re-trigger search after replace to update results
    this.editor().commands.setSearchTerm(this.searchTerm());
    this.syncState();
  }

  protected replaceAll(): void {
    this.editor().commands.replaceAll();
    // Re-trigger search after replace to update results
    this.editor().commands.setSearchTerm(this.searchTerm());
    this.syncState();
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      this.findPrevious();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.findNext();
    }
  }

  protected onReplaceKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.replaceCurrent();
    }
  }

  protected onPanelKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}
