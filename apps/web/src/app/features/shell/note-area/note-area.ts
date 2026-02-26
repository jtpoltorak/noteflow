import { Component, inject, signal, effect, input, output, viewChild, ElementRef } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faPlus, faTrash, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { SlashCommandMenu } from './slash-command-menu';
import type { SlashCommand } from './slash-command-menu';
import type { NoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-note-area',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag, SlashCommandMenu],
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col' },
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
        <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
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

            <!-- Content area (contenteditable) -->
            <div
              #editor
              contenteditable="true"
              class="noteflow-editor min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-gray-700 focus:outline-none dark:text-gray-200"
              (blur)="saveNote()"
              (keydown)="onEditorKeydown($event)"
              (input)="onEditorInput()"
            ></div>

            @if (slashMenuOpen()) {
              <app-slash-command-menu
                [filter]="slashFilter()"
                [position]="slashMenuPosition()"
                (selected)="onCommandSelected($event)"
                (dismissed)="slashMenuOpen.set(false)"
              />
            }
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
  protected deleting = signal(false);
  private dragged = false;

  // Contenteditable editor ref
  private editorRef = viewChild<ElementRef>('editor');

  // Slash command state
  protected slashMenuOpen = signal(false);
  protected slashMenuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  protected slashFilter = signal('');
  private slashAnchorRange: Range | null = null;

  // Slash menu component ref for keyboard forwarding
  private slashMenu = viewChild(SlashCommandMenu);

  // Track which note the local editor fields belong to
  private syncedNoteId: number | null = null;

  constructor() {
    // Sync local editor state when selected note changes
    effect(() => {
      const note = this.state.selectedNote();
      const editorEl = this.editorRef()?.nativeElement;
      if (note && note.id !== this.syncedNoteId) {
        this.editedTitle.set(note.title);
        this.deleting.set(false);
        this.closeSlashMenu();
        // Only mark as synced once the editor DOM is available
        // so the effect re-runs when editorRef resolves
        if (editorEl) {
          editorEl.innerHTML = note.content;
          this.syncedNoteId = note.id;
        }
      } else if (!note) {
        this.syncedNoteId = null;
        this.editedTitle.set('');
        if (editorEl) {
          editorEl.innerHTML = '';
        }
        this.deleting.set(false);
        this.closeSlashMenu();
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
    const editorEl = this.editorRef()?.nativeElement;
    const content = editorEl ? editorEl.innerHTML : '';

    // Treat <br> only or empty as empty content
    const normalizedContent = content === '<br>' ? '' : content;

    if (title === note.title && normalizedContent === note.content) return;

    this.state.updateNote(note.id, {
      title: title || note.title,
      content: normalizedContent,
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

  // ── Slash command logic ──────────────────────────────────────

  protected onEditorKeydown(event: KeyboardEvent): void {
    if (this.slashMenuOpen()) {
      const menu = this.slashMenu();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        menu?.moveDown();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        menu?.moveUp();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        menu?.selectCurrent();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeSlashMenu();
      }
      return;
    }

    if (event.key === '/') {
      // Let the character be typed, then capture position on next tick
      setTimeout(() => this.openSlashMenu(), 0);
    }
  }

  protected onEditorInput(): void {
    if (!this.slashMenuOpen() || !this.slashAnchorRange) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.closeSlashMenu();
      return;
    }

    const currentRange = sel.getRangeAt(0);

    // Check that cursor is still in the same text node as the anchor
    if (this.slashAnchorRange.startContainer !== currentRange.startContainer) {
      this.closeSlashMenu();
      return;
    }

    const textNode = this.slashAnchorRange.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) {
      this.closeSlashMenu();
      return;
    }

    const fullText = textNode.textContent ?? '';
    const anchorOffset = this.slashAnchorRange.startOffset;
    const cursorOffset = currentRange.startOffset;

    // If user backspaced past the `/`, close the menu
    if (cursorOffset <= anchorOffset - 1) {
      this.closeSlashMenu();
      return;
    }

    // Check that the `/` is still at the anchor position
    if (fullText[anchorOffset - 1] !== '/') {
      this.closeSlashMenu();
      return;
    }

    // Extract the text typed after `/`
    const query = fullText.slice(anchorOffset, cursorOffset);
    this.slashFilter.set(query);
  }

  protected onCommandSelected(command: SlashCommand): void {
    this.removeSlashText();
    this.ensureBlockContext();
    this.executeCommand(command);
    this.closeSlashMenu();
    this.saveNote();
  }

  private openSlashMenu(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0).cloneRange();
    this.slashAnchorRange = range;

    // Get caret position in viewport coordinates (menu uses position:fixed)
    const rect = range.getBoundingClientRect();
    const menuHeight = 340; // approx height of full command list
    const gap = 4;

    // Flip above the caret if not enough room below
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight + gap
      ? rect.top - menuHeight - gap   // above
      : rect.bottom + gap;            // below

    this.slashMenuPosition.set({ top, left: rect.left });
    this.slashFilter.set('');
    this.slashMenuOpen.set(true);
  }

  private closeSlashMenu(): void {
    this.slashMenuOpen.set(false);
    this.slashAnchorRange = null;
    this.slashFilter.set('');
  }

  private removeSlashText(): void {
    if (!this.slashAnchorRange) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Find the parent block BEFORE deletion so we can keep it alive
    const parentBlock = this.findParentBlock(this.slashAnchorRange.startContainer);

    const currentRange = sel.getRangeAt(0);
    const deleteRange = document.createRange();

    // Select from just before the `/` to the current cursor position
    deleteRange.setStart(this.slashAnchorRange.startContainer, this.slashAnchorRange.startOffset - 1);
    deleteRange.setEnd(currentRange.startContainer, currentRange.startOffset);
    deleteRange.deleteContents();

    // If the block is now empty, insert a <br> to keep it alive
    if (parentBlock && !parentBlock.textContent && !parentBlock.querySelector('br')) {
      parentBlock.appendChild(document.createElement('br'));
    }

    // Place cursor inside the (preserved) block
    const newRange = document.createRange();
    if (parentBlock && parentBlock.isConnected) {
      newRange.setStart(parentBlock, 0);
      newRange.collapse(true);
    } else {
      // Fallback: use the collapsed delete range position
      newRange.setStart(deleteRange.startContainer, deleteRange.startOffset);
      newRange.collapse(true);
    }
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  private findParentBlock(node: Node): HTMLElement | null {
    const editorEl = this.editorRef()?.nativeElement as HTMLElement;
    let current: Node | null = node;
    while (current && current !== editorEl) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const tag = (current as HTMLElement).tagName.toLowerCase();
        if (['p', 'div', 'h1', 'h2', 'h3', 'blockquote', 'li'].includes(tag)) {
          return current as HTMLElement;
        }
      }
      current = current.parentNode;
    }
    return null;
  }

  private ensureBlockContext(): void {
    const sel = window.getSelection();
    const editorEl = this.editorRef()?.nativeElement as HTMLElement;
    if (!sel || sel.rangeCount === 0 || !editorEl) return;

    // Walk up from cursor to see if we're already inside a block element
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editorEl) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'div', 'blockquote', 'li'].includes(tag)) {
          return; // Already in a block context
        }
      }
      node = node.parentNode;
    }

    // Cursor is directly under contenteditable — collect stray children into a <p>
    const p = document.createElement('p');
    while (editorEl.firstChild) {
      p.appendChild(editorEl.firstChild);
    }
    if (!p.hasChildNodes()) {
      p.appendChild(document.createElement('br'));
    }
    editorEl.appendChild(p);

    // Place cursor inside the new paragraph
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private executeCommand(command: SlashCommand): void {
    const editorEl = this.editorRef()?.nativeElement as HTMLElement;
    if (!editorEl) return;
    editorEl.focus();

    switch (command.id) {
      case 'text':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'heading1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'heading2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'heading3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'bullet-list':
        document.execCommand('insertUnorderedList');
        break;
      case 'number-list':
        document.execCommand('insertOrderedList');
        break;
      case 'quote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'divider':
        this.insertDivider();
        break;
    }
  }

  private insertDivider(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();

    const hr = document.createElement('hr');
    const p = document.createElement('p');
    p.appendChild(document.createElement('br'));

    range.insertNode(p);
    range.insertNode(hr);

    // Move cursor into the new paragraph after the divider
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}
