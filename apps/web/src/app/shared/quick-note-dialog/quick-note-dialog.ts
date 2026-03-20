import { Component, inject, input, output, effect, signal, untracked, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faList,
  faListOl,
  faSquareCheck,
  faPlus,
  faCheck,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TiptapUnderline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Modal } from '../modal/modal';
import { NotebookService } from '../../core/services/notebook.service';
import { SectionService } from '../../core/services/section.service';
import { NoteService } from '../../core/services/note.service';
import { ShellStateService } from '../../features/shell/shell-state.service';
import type { SectionDto } from '@noteflow/shared-types';

export interface QuickNoteResult {
  notebookId: number;
  sectionId: number;
  noteId: number;
}

@Component({
  selector: 'app-quick-note-dialog',
  imports: [Modal, FormsModule, FaIconComponent, TiptapEditorDirective],
  template: `
    <app-modal [open]="open()" title="Quick Note" (closed)="onClose()">
      <div class="flex flex-col gap-4">
        <!-- Title -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            [(ngModel)]="title"
            maxlength="75"
            placeholder="Note title"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        <!-- Notebook & Section side by side -->
        <div class="flex gap-3">
          <!-- Notebook -->
          <div class="flex-1">
            <div class="mb-1 flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Notebook</label>
              @if (!creatingNotebook()) {
                <button
                  (click)="startCreatingNotebook()"
                  class="flex items-center gap-0.5 text-xs text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
                  title="Create new notebook"
                >
                  <fa-icon [icon]="faPlus" size="xs" />
                  <span>New</span>
                </button>
              }
            </div>
            @if (creatingNotebook()) {
              <div class="flex gap-1">
                <input
                  type="text"
                  [(ngModel)]="newNotebookTitle"
                  maxlength="75"
                  placeholder="Notebook name"
                  (keydown.enter)="confirmCreateNotebook()"
                  (keydown.escape)="cancelCreateNotebook()"
                  class="min-w-0 flex-1 rounded border border-accent-400 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-accent-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <button
                  (click)="confirmCreateNotebook()"
                  [disabled]="!newNotebookTitle.trim() || savingNotebook()"
                  class="rounded bg-accent-600 px-1.5 text-white hover:bg-accent-700 disabled:opacity-50"
                  title="Create"
                >
                  <fa-icon [icon]="faCheck" size="sm" />
                </button>
                <button
                  (click)="cancelCreateNotebook()"
                  class="rounded px-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  title="Cancel"
                >
                  <fa-icon [icon]="faXmark" size="sm" />
                </button>
              </div>
            } @else {
              <select
                [(ngModel)]="selectedNotebookId"
                (ngModelChange)="onNotebookChange($event)"
                class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                @if (notebooks().length === 0) {
                  <option value="" disabled>No notebooks yet</option>
                }
                @for (nb of notebooks(); track nb.id) {
                  <option [ngValue]="nb.id">{{ nb.title }}</option>
                }
              </select>
            }
          </div>

          <!-- Section -->
          <div class="flex-1">
            <div class="mb-1 flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
              @if (!creatingSection() && selectedNotebookId) {
                <button
                  (click)="startCreatingSection()"
                  class="flex items-center gap-0.5 text-xs text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
                  title="Create new section"
                >
                  <fa-icon [icon]="faPlus" size="xs" />
                  <span>New</span>
                </button>
              }
            </div>
            @if (creatingSection()) {
              <div class="flex gap-1">
                <input
                  type="text"
                  [(ngModel)]="newSectionTitle"
                  maxlength="75"
                  placeholder="Section name"
                  (keydown.enter)="confirmCreateSection()"
                  (keydown.escape)="cancelCreateSection()"
                  class="min-w-0 flex-1 rounded border border-accent-400 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-accent-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <button
                  (click)="confirmCreateSection()"
                  [disabled]="!newSectionTitle.trim() || savingSection()"
                  class="rounded bg-accent-600 px-1.5 text-white hover:bg-accent-700 disabled:opacity-50"
                  title="Create"
                >
                  <fa-icon [icon]="faCheck" size="sm" />
                </button>
                <button
                  (click)="cancelCreateSection()"
                  class="rounded px-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  title="Cancel"
                >
                  <fa-icon [icon]="faXmark" size="sm" />
                </button>
              </div>
            } @else {
              <select
                [(ngModel)]="selectedSectionId"
                class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [disabled]="sections().length === 0 || !selectedNotebookId"
              >
                @if (sections().length === 0) {
                  <option value="" disabled>No sections</option>
                }
                @for (sec of sections(); track sec.id) {
                  <option [ngValue]="sec.id">{{ sec.title }}</option>
                }
              </select>
            }
          </div>
        </div>

        <!-- Mini editor -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Content <span class="font-normal text-gray-400">(optional)</span></label>
          @if (editor) {
            <!-- Formatting toolbar -->
            <div class="flex items-center gap-0.5 rounded-t border border-b-0 border-gray-300 bg-gray-50 px-1.5 py-1 dark:border-gray-600 dark:bg-gray-800">
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleBold().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('bold')"
                [class.dark:bg-accent-900]="editor.isActive('bold')"
                [class.text-gray-600]="!editor.isActive('bold')"
                [class.dark:text-gray-300]="!editor.isActive('bold')"
                [class.hover:bg-gray-200]="!editor.isActive('bold')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('bold')"
                title="Bold"
              ><fa-icon [icon]="faBold" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleItalic().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('italic')"
                [class.dark:bg-accent-900]="editor.isActive('italic')"
                [class.text-gray-600]="!editor.isActive('italic')"
                [class.dark:text-gray-300]="!editor.isActive('italic')"
                [class.hover:bg-gray-200]="!editor.isActive('italic')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('italic')"
                title="Italic"
              ><fa-icon [icon]="faItalic" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleUnderline().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('underline')"
                [class.dark:bg-accent-900]="editor.isActive('underline')"
                [class.text-gray-600]="!editor.isActive('underline')"
                [class.dark:text-gray-300]="!editor.isActive('underline')"
                [class.hover:bg-gray-200]="!editor.isActive('underline')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('underline')"
                title="Underline"
              ><fa-icon [icon]="faUnderline" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleStrike().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('strike')"
                [class.dark:bg-accent-900]="editor.isActive('strike')"
                [class.text-gray-600]="!editor.isActive('strike')"
                [class.dark:text-gray-300]="!editor.isActive('strike')"
                [class.hover:bg-gray-200]="!editor.isActive('strike')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('strike')"
                title="Strikethrough"
              ><fa-icon [icon]="faStrikethrough" size="sm" /></button>

              <div class="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleBulletList().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('bulletList')"
                [class.dark:bg-accent-900]="editor.isActive('bulletList')"
                [class.text-gray-600]="!editor.isActive('bulletList')"
                [class.dark:text-gray-300]="!editor.isActive('bulletList')"
                [class.hover:bg-gray-200]="!editor.isActive('bulletList')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('bulletList')"
                title="Bullet list"
              ><fa-icon [icon]="faList" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleOrderedList().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('orderedList')"
                [class.dark:bg-accent-900]="editor.isActive('orderedList')"
                [class.text-gray-600]="!editor.isActive('orderedList')"
                [class.dark:text-gray-300]="!editor.isActive('orderedList')"
                [class.hover:bg-gray-200]="!editor.isActive('orderedList')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('orderedList')"
                title="Numbered list"
              ><fa-icon [icon]="faListOl" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleTaskList().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-accent-100]="editor.isActive('taskList')"
                [class.dark:bg-accent-900]="editor.isActive('taskList')"
                [class.text-gray-600]="!editor.isActive('taskList')"
                [class.dark:text-gray-300]="!editor.isActive('taskList')"
                [class.hover:bg-gray-200]="!editor.isActive('taskList')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('taskList')"
                title="Task list"
              ><fa-icon [icon]="faSquareCheck" size="sm" /></button>
            </div>

            <!-- Editor area -->
            <div
              class="noteflow-editor min-h-[120px] max-h-[200px] overflow-y-auto rounded-b border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            >
              <div tiptap [editor]="editor"></div>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-1">
          <button
            (click)="onClose()"
            class="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            (click)="create()"
            [disabled]="!canCreate()"
            class="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class QuickNoteDialog implements OnDestroy {
  open = input(false);
  closed = output();
  created = output<QuickNoteResult>();

  private notebookSvc = inject(NotebookService);
  private sectionSvc = inject(SectionService);
  private noteSvc = inject(NoteService);
  private state = inject(ShellStateService);

  protected notebooks = this.state.notebooks;
  protected sections = signal<SectionDto[]>([]);

  protected title = '';
  protected selectedNotebookId: number | '' = '';
  protected selectedSectionId: number | '' = '';

  // Inline creation state
  protected creatingNotebook = signal(false);
  protected creatingSection = signal(false);
  protected savingNotebook = signal(false);
  protected savingSection = signal(false);
  protected newNotebookTitle = '';
  protected newSectionTitle = '';

  // Icons
  protected faBold = faBold;
  protected faItalic = faItalic;
  protected faUnderline = faUnderline;
  protected faStrikethrough = faStrikethrough;
  protected faList = faList;
  protected faListOl = faListOl;
  protected faSquareCheck = faSquareCheck;
  protected faPlus = faPlus;
  protected faCheck = faCheck;
  protected faXmark = faXmark;

  // Mini TipTap editor
  protected editor: Editor | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) return;

      // Only track open() — read notebooks/selection without subscribing
      // so this effect doesn't re-run when notebooks are created inline
      untracked(() => {
        this.title = '';
        this.resetInlineCreation();
        this.initEditor();

        const nbs = this.notebooks();
        if (nbs.length === 0) return;

        const currentNbId = this.state.selectedNotebookId();
        const defaultNbId = currentNbId && nbs.some((n) => n.id === currentNbId) ? currentNbId : nbs[0].id;
        this.selectedNotebookId = defaultNbId;
        this.loadSections(defaultNbId);

        requestAnimationFrame(() => {
          document.querySelector<HTMLInputElement>('app-quick-note-dialog input[type="text"]')?.focus();
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyEditor();
  }

  protected canCreate(): boolean {
    return !!this.title.trim() && !!this.selectedSectionId;
  }

  protected onNotebookChange(notebookId: number): void {
    this.selectedSectionId = '';
    this.sections.set([]);
    this.cancelCreateSection();
    this.loadSections(notebookId);
  }

  protected onClose(): void {
    this.destroyEditor();
    this.resetInlineCreation();
    this.closed.emit();
  }

  protected create(): void {
    if (!this.canCreate()) return;

    const sectionId = Number(this.selectedSectionId);
    const notebookId = Number(this.selectedNotebookId);
    const title = this.title.trim();
    const html = this.editor?.getHTML() ?? '';
    const content = html && html !== '<p></p>' ? html : undefined;

    this.noteSvc.create(sectionId, title, content).subscribe((note) => {
      this.destroyEditor();
      this.created.emit({ notebookId, sectionId, noteId: note.id });
      this.closed.emit();
    });
  }

  // --- Inline notebook creation ---

  protected startCreatingNotebook(): void {
    this.newNotebookTitle = '';
    this.creatingNotebook.set(true);
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('app-quick-note-dialog input[placeholder="Notebook name"]')?.focus();
    });
  }

  protected cancelCreateNotebook(): void {
    this.creatingNotebook.set(false);
    this.newNotebookTitle = '';
  }

  protected confirmCreateNotebook(): void {
    const title = this.newNotebookTitle.trim();
    if (!title) return;

    this.savingNotebook.set(true);
    this.notebookSvc.create(title).subscribe({
      next: (notebook) => {
        // Refresh the sidebar notebook list, then select the new notebook
        // once the list has actually updated
        this.notebookSvc.getAll().subscribe((list) => {
          this.state.notebooks.set(list);
          this.selectedNotebookId = notebook.id;
          this.sections.set([]);
          this.selectedSectionId = '';
          this.creatingNotebook.set(false);
          this.savingNotebook.set(false);
          this.newNotebookTitle = '';
          // New notebook has no sections — prompt to create one
          this.startCreatingSection();
        });
      },
      error: () => {
        this.savingNotebook.set(false);
      },
    });
  }

  // --- Inline section creation ---

  protected startCreatingSection(): void {
    this.newSectionTitle = '';
    this.creatingSection.set(true);
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('app-quick-note-dialog input[placeholder="Section name"]')?.focus();
    });
  }

  protected cancelCreateSection(): void {
    this.creatingSection.set(false);
    this.newSectionTitle = '';
  }

  protected confirmCreateSection(): void {
    const title = this.newSectionTitle.trim();
    const notebookId = Number(this.selectedNotebookId);
    if (!title || !notebookId) return;

    this.savingSection.set(true);
    this.sectionSvc.create(notebookId, title).subscribe({
      next: (section) => {
        this.sections.update((prev) => [...prev, section]);
        this.selectedSectionId = section.id;
        this.creatingSection.set(false);
        this.savingSection.set(false);
        this.newSectionTitle = '';
      },
      error: () => {
        this.savingSection.set(false);
      },
    });
  }

  // --- Editor lifecycle ---

  private initEditor(): void {
    this.destroyEditor();
    this.editor = new Editor({
      extensions: [
        StarterKit.configure({ heading: false, codeBlock: false, code: false, blockquote: false, horizontalRule: false }),
        TiptapUnderline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: 'Start writing...' }),
      ],
      content: '',
    });
  }

  private destroyEditor(): void {
    if (this.editor && !this.editor.isDestroyed) {
      this.editor.destroy();
    }
    this.editor = null;
  }

  private loadSections(notebookId: number): void {
    this.sectionSvc.getByNotebook(notebookId).subscribe((sections) => {
      this.sections.set(sections);
      const currentSecId = this.state.selectedSectionId();
      if (currentSecId && sections.some((s) => s.id === currentSecId)) {
        this.selectedSectionId = currentSecId;
      } else if (sections.length > 0) {
        this.selectedSectionId = sections[0].id;
      }
    });
  }

  private resetInlineCreation(): void {
    this.creatingNotebook.set(false);
    this.creatingSection.set(false);
    this.savingNotebook.set(false);
    this.savingSection.set(false);
    this.newNotebookTitle = '';
    this.newSectionTitle = '';
  }
}
