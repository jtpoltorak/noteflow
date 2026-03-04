import { Component, ElementRef, inject, signal, effect, input, output, viewChild, computed } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faPlus, faTrash, faChevronLeft, faChevronRight, faExpand, faCompress, faDesktop, faCopy, faArrowRightArrowLeft, faDownload, faFileImport, faBoxArchive, faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { TiptapEditor } from './tiptap-editor/tiptap-editor';
import { PresentationView } from './presentation-view';
import { MoveNoteDialog } from './move-note-dialog';
import { exportNoteAsMarkdown } from '../../../core/utils/export-markdown';
import { parseMarkdownFile } from '../../../core/utils/import-markdown';
import type { NoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-note-area',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag, TiptapEditor, PresentationView, MoveNoteDialog],
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col' },
  template: `
    <!-- ── Mobile: notes list only ─────────────────────────── -->
    @if (mobileMode() && !showEditorOnly()) {
      <div class="flex flex-1 flex-col overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</span>
          <div class="flex items-center gap-1">
            <button
              (click)="importNote()"
              class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Import Markdown"
            >
              <fa-icon [icon]="faFileImport" size="sm" />
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
        <div class="flex-1 overflow-y-auto p-1">
          @if (!state.selectedSectionId()) {
            <p class="px-2 py-4 text-center text-sm text-gray-400">Select a section to see notes</p>
          } @else {
            @for (note of state.notes(); track note.id) {
              <div
                class="cursor-pointer rounded px-2 py-1.5 text-sm dark:text-gray-200"
                [class.bg-blue-100]="note.id === state.selectedNoteId()"
                [class.dark:bg-blue-900]="note.id === state.selectedNoteId()"
                [class.hover:bg-gray-100]="note.id !== state.selectedNoteId()"
                [class.dark:hover:bg-gray-700]="note.id !== state.selectedNoteId()"
                (click)="onItemClick(note.id)"
              >
                <div class="flex items-center">
                  <fa-icon [icon]="faStickyNote" class="mr-2 text-gray-400" size="sm" />
                  <span class="truncate" [title]="note.title">{{ note.title || 'Untitled' }}</span>
                </div>
              </div>
            } @empty {
              <p class="px-2 py-4 text-center text-sm text-gray-400">
                No notes yet. Click + to create one.
              </p>
            }
          }
        </div>
      </div>
    }

    <!-- ── Mobile: editor only ─────────────────────────────── -->
    @if (mobileMode() && showEditorOnly()) {
      <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
        @if (state.selectedNote()) {
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <input
              type="text"
              [value]="editedTitle()"
              maxlength="75"
              (input)="editedTitle.set($any($event.target).value)"
              (blur)="saveNote()"
              class="min-w-0 flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
              placeholder="Note title"
            />
            <button
              (click)="toggleFavorite()"
              class="ml-2 shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              [class]="state.selectedNote()?.favoritedAt ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
              [title]="state.selectedNote()?.favoritedAt ? 'Remove from favorites' : 'Add to favorites'"
            >
              <fa-icon [icon]="state.selectedNote()?.favoritedAt ? faStar : farStar" size="sm" />
            </button>
            <button
              (click)="moving.set(true)"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Move note"
            >
              <fa-icon [icon]="faArrowRightArrowLeft" size="sm" />
            </button>
            <button
              (click)="copyNote()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Duplicate note"
            >
              <fa-icon [icon]="faCopy" size="sm" />
            </button>
            <button
              (click)="exportNote()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Export as Markdown"
            >
              <fa-icon [icon]="faDownload" size="sm" />
            </button>
            <button
              (click)="startArchiving()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Archive note"
            >
              <fa-icon [icon]="faBoxArchive" size="sm" />
            </button>
            <button
              (click)="startDeleting()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:text-red-600"
              title="Delete note"
            >
              <fa-icon [icon]="faTrash" size="sm" />
            </button>
          </div>

          @if (archiving()) {
            <div class="px-4">
              <app-confirm-dialog
                message="Archive this note? You can restore it later from the archive."
                confirmLabel="Archive"
                (confirmed)="confirmArchive()"
                (cancelled)="archiving.set(false)"
              ></app-confirm-dialog>
            </div>
          }

          @if (deleting()) {
            <div class="px-4">
              <app-confirm-dialog
                message="Delete this note?"
                (confirmed)="confirmDelete()"
                (cancelled)="deleting.set(false)"
              ></app-confirm-dialog>
            </div>
          }

          <app-tiptap-editor
            #tiptapEditor
            (contentUpdated)="pendingContent = $event"
            (contentChanged)="onContentChanged($event)"
            (blurred)="saveNote()"
          />
        } @else {
          <div class="flex flex-1 items-center justify-center">
            <p class="text-gray-400">Select a note to edit</p>
          </div>
        }
      </div>
    }

    <!-- ── Desktop: original layout ────────────────────────── -->
    @if (!mobileMode()) {
      @if (!state.selectedSectionId()) {
        <div class="flex flex-1 items-center justify-center">
          <p class="text-gray-400">Select a section to see notes</p>
        </div>
      } @else {
        <div class="flex flex-1 overflow-hidden">
          <!-- Note list: collapsed strip or full panel -->
          @if (!fullscreen() && !hideNotesList()) {
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
                      (click)="importNote()"
                      class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Import Markdown"
                    >
                      <fa-icon [icon]="faFileImport" size="sm" />
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
                        <span class="truncate" [title]="note.title">{{ note.title || 'Untitled' }}</span>
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
          }

          <!-- Editor area -->
          <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
            @if (state.selectedNote()) {
              <!-- Editor header -->
              <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <input
                  type="text"
                  [value]="editedTitle()"
                  maxlength="75"
                  (input)="editedTitle.set($any($event.target).value)"
                  (blur)="saveNote()"
                  class="flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
                  placeholder="Note title"
                />
                <span class="ml-3 shrink-0 text-xs text-gray-400 dark:text-gray-500">{{ noteTimestamp() }}</span>
                <button
                  (click)="openPresentation()"
                  class="ml-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Present"
                >
                  <fa-icon [icon]="faDesktop" size="sm" />
                </button>
                <button
                  (click)="toggleFullscreen.emit()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  [title]="fullscreen() ? 'Exit full screen' : 'Full screen'"
                >
                  <fa-icon [icon]="fullscreen() ? faCompress : faExpand" size="sm" />
                </button>
                <button
                  (click)="toggleFavorite()"
                  class="ml-1 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                  [class]="state.selectedNote()?.favoritedAt ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  [title]="state.selectedNote()?.favoritedAt ? 'Remove from favorites' : 'Add to favorites'"
                >
                  <fa-icon [icon]="state.selectedNote()?.favoritedAt ? faStar : farStar" size="sm" />
                </button>
                <button
                  (click)="moving.set(true)"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Move note"
                >
                  <fa-icon [icon]="faArrowRightArrowLeft" size="sm" />
                </button>
                <button
                  (click)="copyNote()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Duplicate note"
                >
                  <fa-icon [icon]="faCopy" size="sm" />
                </button>
                <button
                  (click)="exportNote()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Export as Markdown"
                >
                  <fa-icon [icon]="faDownload" size="sm" />
                </button>
                <button
                  (click)="startArchiving()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Archive note"
                >
                  <fa-icon [icon]="faBoxArchive" size="sm" />
                </button>
                <button
                  (click)="startDeleting()"
                  class="ml-1 rounded p-1 text-gray-400 hover:text-red-600"
                  title="Delete note"
                >
                  <fa-icon [icon]="faTrash" size="sm" />
                </button>
              </div>

              @if (archiving()) {
                <div class="px-4">
                  <app-confirm-dialog
                    message="Archive this note? You can restore it later from the archive."
                    confirmLabel="Archive"
                    (confirmed)="confirmArchive()"
                    (cancelled)="archiving.set(false)"
                  ></app-confirm-dialog>
                </div>
              }

              @if (deleting()) {
                <div class="px-4">
                  <app-confirm-dialog
                    message="Delete this note?"
                    (confirmed)="confirmDelete()"
                    (cancelled)="deleting.set(false)"
                  ></app-confirm-dialog>
                </div>
              }

              <app-tiptap-editor
                #tiptapEditor
                (contentChanged)="onContentChanged($event)"
                (blurred)="saveNote()"
              />
            } @else {
              <div class="flex flex-1 items-center justify-center">
                <p class="text-gray-400">Select a note to edit</p>
              </div>
            }
          </div>
        </div>
      }
    }

    <!-- ── Move note dialog ──────────────────────────────────── -->
    @if (moving() && state.selectedNote()) {
      <app-move-note-dialog
        [currentSectionId]="state.selectedNote()!.sectionId"
        (moved)="onMoved($event)"
        (cancelled)="moving.set(false)"
      />
    }

    <!-- ── Presentation mode overlay ──────────────────────────── -->
    @if (presentationOpen() && state.selectedNote()) {
      <app-presentation-view
        [title]="state.selectedNote()!.title"
        [content]="presentationContent()"
        (closed)="presentationOpen.set(false)"
      />
    }

    <!-- Hidden file input for markdown import -->
    <input
      #fileInput
      type="file"
      accept=".md,.markdown,.txt"
      class="hidden"
      (change)="onFileSelected($event)"
    />
  `,
})
export class NoteArea {
  protected state = inject(ShellStateService);
  protected vp = inject(ViewportService);

  collapsed = input(false);
  fullscreen = input(false);
  hideNotesList = input(false);
  mobileMode = input(false);
  showEditorOnly = input(false);
  toggleCollapsed = output();
  toggleFullscreen = output();

  protected faStickyNote = faStickyNote;
  protected faPlus = faPlus;
  protected faTrash = faTrash;
  protected faChevronLeft = faChevronLeft;
  protected faChevronRight = faChevronRight;
  protected faExpand = faExpand;
  protected faCompress = faCompress;
  protected faDesktop = faDesktop;
  protected faCopy = faCopy;
  protected faArrowRightArrowLeft = faArrowRightArrowLeft;
  protected faDownload = faDownload;
  protected faFileImport = faFileImport;
  protected faBoxArchive = faBoxArchive;
  protected faStar = faStar;
  protected farStar = farStar;

  protected moving = signal(false);
  protected archiving = signal(false);
  protected presentationOpen = signal(false);
  protected presentationContent = signal('');
  protected editedTitle = signal('');
  protected deleting = signal(false);

  protected noteTimestamp = computed(() => {
    const note = this.state.selectedNote();
    if (!note) return '';
    const isNew = note.createdAt === note.updatedAt;
    const date = new Date(isNew ? note.createdAt : note.updatedAt);
    const label = isNew ? 'Created' : 'Updated';
    return `${label} ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  });
  private dragged = false;

  // TipTap editor ref
  private tiptapEditor = viewChild<TiptapEditor>('tiptapEditor');
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Track latest content from TipTap (for saving)
  protected pendingContent: string | null = null;

  // Track which note & editor instance have been synced
  private syncedNoteId: number | null = null;
  private syncedEditorRef: TiptapEditor | undefined = undefined;

  protected openPresentation(): void {
    const editor = this.tiptapEditor();
    this.presentationContent.set(editor ? editor.getHTML() : this.state.selectedNote()?.content ?? '');
    this.presentationOpen.set(true);
  }

  constructor() {
    // Sync local editor state when the selected note OR editor instance changes.
    // The editor instance changes when toggling between mobile/desktop viewport
    // because each mode has its own <app-tiptap-editor> in a separate @if branch.
    effect(() => {
      const note = this.state.selectedNote();
      const editor = this.tiptapEditor();
      const editorChanged = editor !== this.syncedEditorRef;

      if (note && (note.id !== this.syncedNoteId || (editorChanged && editor))) {
        // Editor swapped for the same note (viewport switch) — preserve pending edits
        const contentForEditor = (editorChanged && note.id === this.syncedNoteId && this.pendingContent !== null)
          ? this.pendingContent
          : note.content;

        if (note.id !== this.syncedNoteId) {
          this.editedTitle.set(note.title);
          this.deleting.set(false);
        }

        this.pendingContent = null;
        if (editor) {
          editor.setContent(contentForEditor);
          this.syncedNoteId = note.id;
          this.syncedEditorRef = editor;
        }
      } else if (!note) {
        this.syncedNoteId = null;
        this.syncedEditorRef = undefined;
        this.editedTitle.set('');
        this.pendingContent = null;
        if (editor) {
          editor.setContent('');
        }
        this.deleting.set(false);
      }
    });
  }

  protected createNote(): void {
    this.state.createNote('Untitled note');
  }

  protected onContentChanged(html: string): void {
    this.pendingContent = html;
  }

  protected saveNote(): void {
    const note = this.state.selectedNote();
    if (!note) return;

    const title = this.editedTitle().trim();
    const editor = this.tiptapEditor();
    const content = this.pendingContent ?? editor?.getHTML() ?? '';

    // Treat empty paragraph as empty content
    const normalizedContent = content === '<p></p>' ? '' : content;

    if (title === note.title && normalizedContent === note.content) return;

    this.state.updateNote(note.id, {
      title: title || note.title,
      content: normalizedContent,
    });
  }

  protected onMoved(targetSectionId: number): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (note) {
      this.state.moveNote(note.id, targetSectionId);
    }
    this.moving.set(false);
  }

  protected copyNote(): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (note) {
      this.state.duplicateNote(note.id);
    }
  }

  protected exportNote(): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (!note) return;
    const editor = this.tiptapEditor();
    const content = editor ? editor.getHTML() : note.content;
    exportNoteAsMarkdown(note.title, content);
  }

  protected importNote(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const { title, html } = await parseMarkdownFile(file);
    this.state.createNote(title, html);

    // Reset so the same file can be re-imported
    input.value = '';
  }

  protected toggleFavorite(): void {
    const note = this.state.selectedNote();
    if (!note) return;
    if (note.favoritedAt) {
      this.state.unfavoriteNote(note.id);
    } else {
      this.state.favoriteNote(note.id);
    }
  }

  protected startArchiving(): void {
    this.archiving.set(true);
  }

  protected confirmArchive(): void {
    const note = this.state.selectedNote();
    if (note) {
      this.state.archiveNote(note.id);
    }
    this.archiving.set(false);
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
