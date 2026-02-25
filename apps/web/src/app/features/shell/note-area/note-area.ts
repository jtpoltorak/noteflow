import { Component, inject, signal, effect, input, output } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faPlus, faTrash, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import type { NoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-note-area',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag],
  host: { class: 'flex flex-1 flex-col' },
  template: `
    @if (!state.selectedSectionId()) {
      <div class="flex flex-1 items-center justify-center">
        <p class="text-gray-400">Select a section to see notes</p>
      </div>
    } @else {
      <div class="flex flex-1 overflow-hidden">
        <!-- Note list: collapsed strip or full panel -->
        @if (collapsed()) {
          <div class="flex w-8 flex-col items-center border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <button
              (click)="toggleCollapsed.emit()"
              class="mt-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Expand notes"
            >
              <fa-icon [icon]="faChevronRight" size="xs" />
            </button>
          </div>
        } @else {
          <div class="flex w-48 flex-col border-r border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
              <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</span>
              <div class="flex items-center gap-1">
                <button
                  (click)="toggleCollapsed.emit()"
                  class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Collapse panel"
                >
                  <fa-icon [icon]="faChevronLeft" size="xs" />
                </button>
                <button
                  (click)="createNote()"
                  class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="New note"
                >
                  <fa-icon [icon]="faPlus" size="sm" />
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-1" cdkDropList (cdkDropListDropped)="onDrop($event)">
              @for (note of state.notes(); track note.id) {
                <div
                  cdkDrag
                  class="cursor-pointer rounded px-2 py-1.5 text-sm dark:text-gray-200"
                  [class.bg-blue-100]="note.id === state.selectedNoteId()"
                  [class.dark:bg-blue-900]="note.id === state.selectedNoteId()"
                  [class.hover:bg-gray-100]="note.id !== state.selectedNoteId()"
                  [class.dark:hover:bg-gray-700]="note.id !== state.selectedNoteId()"
                  (click)="onItemClick(note.id)"
                >
                  <div class="flex items-center">
                    <fa-icon [icon]="faStickyNote" class="mr-2 text-gray-400" size="sm" />
                    <span class="truncate">{{ note.title || 'Untitled' }}</span>
                  </div>
                </div>
              } @empty {
                <p class="px-2 py-4 text-center text-sm text-gray-400">
                  No notes yet. Click + to create one.
                </p>
              }
            </div>
          </div>
        }

        <!-- Editor area -->
        <div class="flex flex-1 flex-col">
          @if (state.selectedNote()) {
            <!-- Editor header -->
            <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
              <input
                type="text"
                [value]="editedTitle()"
                (input)="editedTitle.set($any($event.target).value)"
                (blur)="saveNote()"
                class="flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
                placeholder="Note title"
              />
              <button
                (click)="startDeleting()"
                class="ml-2 rounded p-1 text-gray-400 hover:text-red-600"
                title="Delete note"
              >
                <fa-icon [icon]="faTrash" size="sm" />
              </button>
            </div>

            @if (deleting()) {
              <div class="px-4">
                <app-confirm-dialog
                  message="Delete this note?"
                  (confirmed)="confirmDelete()"
                  (cancelled)="deleting.set(false)"
                ></app-confirm-dialog>
              </div>
            }

            <!-- Content area -->
            <textarea
              class="flex-1 resize-none bg-transparent p-4 text-gray-700 focus:outline-none dark:text-gray-200"
              [value]="editedContent()"
              (input)="editedContent.set($any($event.target).value)"
              (blur)="saveNote()"
              placeholder="Start typing..."
            ></textarea>
          } @else {
            <div class="flex flex-1 items-center justify-center">
              <p class="text-gray-400">Select a note to edit</p>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class NoteArea {
  protected state = inject(ShellStateService);

  collapsed = input(false);
  toggleCollapsed = output();

  protected faStickyNote = faStickyNote;
  protected faPlus = faPlus;
  protected faTrash = faTrash;
  protected faChevronLeft = faChevronLeft;
  protected faChevronRight = faChevronRight;

  protected editedTitle = signal('');
  protected editedContent = signal('');
  protected deleting = signal(false);
  private dragged = false;

  // Track which note the local editor fields belong to
  private syncedNoteId: number | null = null;

  constructor() {
    // Sync local editor state when selected note changes
    effect(() => {
      const note = this.state.selectedNote();
      if (note && note.id !== this.syncedNoteId) {
        this.syncedNoteId = note.id;
        this.editedTitle.set(note.title);
        this.editedContent.set(note.content);
        this.deleting.set(false);
      } else if (!note) {
        this.syncedNoteId = null;
        this.editedTitle.set('');
        this.editedContent.set('');
        this.deleting.set(false);
      }
    });
  }

  protected createNote(): void {
    this.state.createNote('Untitled note');
  }

  protected saveNote(): void {
    const note = this.state.selectedNote();
    if (!note) return;

    const title = this.editedTitle().trim();
    const content = this.editedContent();

    if (title === note.title && content === note.content) return;

    this.state.updateNote(note.id, {
      title: title || note.title, // Don't save empty title
      content,
    });
  }

  protected startDeleting(): void {
    this.deleting.set(true);
  }

  protected confirmDelete(): void {
    const note = this.state.selectedNote();
    if (note) {
      this.state.deleteNote(note.id);
    }
    this.deleting.set(false);
  }

  protected onDrop(event: CdkDragDrop<NoteDto[]>): void {
    this.dragged = true;
    if (event.previousIndex === event.currentIndex) return;
    const list = [...this.state.notes()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.state.reorderNotes(list);
  }

  protected onItemClick(id: number): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    this.state.selectNote(id);
  }
}
