import { Component, inject, signal, output, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faTags, faChevronLeft, faSpinner, faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import { TagService } from '../../../core/services/tag.service';
import type { TagWithCountDto, TaggedNoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-tags-panel',
  imports: [FaIconComponent],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-hidden' },
  template: `
    <div class="flex h-full flex-col">
      @if (!selectedTag()) {
        <!-- Level 1: Tag list -->
        <div class="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags</span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          @if (loading()) {
            <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
              <fa-icon [icon]="faSpinner" class="animate-spin" />
              Loading…
            </div>
          } @else if (tags().length === 0) {
            <p class="px-4 py-8 text-center text-sm text-gray-400">No tags yet. Add tags to notes from the editor toolbar.</p>
          } @else {
            <ul class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (tag of tags(); track tag.id) {
                <li
                  class="cursor-pointer px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                  (click)="onTagClicked(tag)"
                >
                  <div class="flex items-center gap-2">
                    <fa-icon [icon]="faTags" class="shrink-0 text-gray-400" size="sm" />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="tag.name">
                        {{ tag.name }}
                      </p>
                    </div>
                    <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {{ tag.noteCount }}
                    </span>
                    <button
                      (click)="startRenaming($event, tag)"
                      class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Rename tag"
                    >
                      <fa-icon [icon]="faPen" size="xs" />
                    </button>
                    <button
                      (click)="onDeleteTag($event, tag)"
                      class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                      title="Delete tag"
                    >
                      <fa-icon [icon]="faTrash" size="xs" />
                    </button>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      } @else {
        <!-- Level 2: Notes for selected tag -->
        <div class="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <button
            (click)="backToTags()"
            class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Back to tags"
          >
            <fa-icon [icon]="faChevronLeft" size="xs" />
          </button>
          <span class="truncate text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ selectedTag()!.name }}
          </span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          @if (notesLoading()) {
            <div class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
              <fa-icon [icon]="faSpinner" class="animate-spin" />
              Loading…
            </div>
          } @else if (tagNotes().length === 0) {
            <p class="px-4 py-8 text-center text-sm text-gray-400">No notes with this tag.</p>
          } @else {
            <ul class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (note of tagNotes(); track note.id) {
                <li
                  class="cursor-pointer px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                  (click)="onNoteClicked(note)"
                >
                  <div class="flex items-start gap-2">
                    <fa-icon [icon]="faStickyNote" class="mt-0.5 shrink-0 text-gray-400" size="sm" />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100" [title]="note.title">
                        {{ note.title }}
                      </p>
                      <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                        {{ note.notebookTitle }} &rsaquo; {{ note.sectionTitle }}
                      </p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">
                        Updated {{ formatDate(note.updatedAt) }}
                      </p>
                    </div>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class TagsPanel implements OnInit {
  private tagSvc = inject(TagService);

  resultClicked = output<{ notebookId: number; sectionId: number; noteId: number }>();

  protected faStickyNote = faStickyNote;
  protected faTags = faTags;
  protected faChevronLeft = faChevronLeft;
  protected faSpinner = faSpinner;
  protected faTrash = faTrash;
  protected faPen = faPen;

  protected tags = signal<TagWithCountDto[]>([]);
  protected loading = signal(false);

  protected selectedTag = signal<TagWithCountDto | null>(null);
  protected tagNotes = signal<TaggedNoteDto[]>([]);
  protected notesLoading = signal(false);

  ngOnInit(): void {
    this.loadTags();
  }

  private loadTags(): void {
    this.loading.set(true);
    this.tagSvc.getAll().subscribe({
      next: (list) => {
        this.tags.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected onTagClicked(tag: TagWithCountDto): void {
    this.selectedTag.set(tag);
    this.notesLoading.set(true);
    this.tagSvc.getNotesByTag(tag.id).subscribe({
      next: (notes) => {
        this.tagNotes.set(notes);
        this.notesLoading.set(false);
      },
      error: () => this.notesLoading.set(false),
    });
  }

  protected backToTags(): void {
    this.selectedTag.set(null);
    this.tagNotes.set([]);
    this.loadTags();
  }

  protected onNoteClicked(note: TaggedNoteDto): void {
    this.resultClicked.emit({ notebookId: note.notebookId, sectionId: note.sectionId, noteId: note.id });
  }

  protected startRenaming(event: Event, tag: TagWithCountDto): void {
    event.stopPropagation();
    const newName = prompt('Rename tag:', tag.name);
    if (newName && newName.trim() && newName.trim() !== tag.name) {
      this.tagSvc.rename(tag.id, newName.trim()).subscribe({
        next: (updated) => {
          this.tags.update((list) => list.map((t) => (t.id === tag.id ? { ...t, name: updated.name } : t)));
        },
      });
    }
  }

  protected onDeleteTag(event: Event, tag: TagWithCountDto): void {
    event.stopPropagation();
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all notes.`)) return;
    this.tagSvc.delete(tag.id).subscribe(() => {
      this.tags.update((list) => list.filter((t) => t.id !== tag.id));
    });
  }
}
