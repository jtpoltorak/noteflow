import { Component, inject, input, output, effect, signal, OnDestroy } from '@angular/core';
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
} from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TiptapUnderline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Modal } from '../modal/modal';
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
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        <!-- Notebook & Section side by side -->
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notebook</label>
            <select
              [(ngModel)]="selectedNotebookId"
              (ngModelChange)="onNotebookChange($event)"
              class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              @for (nb of notebooks(); track nb.id) {
                <option [value]="nb.id">{{ nb.title }}</option>
              }
            </select>
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
            <select
              [(ngModel)]="selectedSectionId"
              class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              [disabled]="sections().length === 0"
            >
              @for (sec of sections(); track sec.id) {
                <option [value]="sec.id">{{ sec.title }}</option>
              }
              @if (sections().length === 0) {
                <option value="" disabled>No sections in this notebook</option>
              }
            </select>
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
                [class.bg-blue-100]="editor.isActive('bold')"
                [class.dark:bg-blue-900]="editor.isActive('bold')"
                [class.text-gray-600]="!editor.isActive('bold')"
                [class.dark:text-gray-300]="!editor.isActive('bold')"
                [class.hover:bg-gray-200]="!editor.isActive('bold')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('bold')"
                title="Bold"
              ><fa-icon [icon]="faBold" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleItalic().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-blue-100]="editor.isActive('italic')"
                [class.dark:bg-blue-900]="editor.isActive('italic')"
                [class.text-gray-600]="!editor.isActive('italic')"
                [class.dark:text-gray-300]="!editor.isActive('italic')"
                [class.hover:bg-gray-200]="!editor.isActive('italic')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('italic')"
                title="Italic"
              ><fa-icon [icon]="faItalic" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleUnderline().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-blue-100]="editor.isActive('underline')"
                [class.dark:bg-blue-900]="editor.isActive('underline')"
                [class.text-gray-600]="!editor.isActive('underline')"
                [class.dark:text-gray-300]="!editor.isActive('underline')"
                [class.hover:bg-gray-200]="!editor.isActive('underline')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('underline')"
                title="Underline"
              ><fa-icon [icon]="faUnderline" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleStrike().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-blue-100]="editor.isActive('strike')"
                [class.dark:bg-blue-900]="editor.isActive('strike')"
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
                [class.bg-blue-100]="editor.isActive('bulletList')"
                [class.dark:bg-blue-900]="editor.isActive('bulletList')"
                [class.text-gray-600]="!editor.isActive('bulletList')"
                [class.dark:text-gray-300]="!editor.isActive('bulletList')"
                [class.hover:bg-gray-200]="!editor.isActive('bulletList')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('bulletList')"
                title="Bullet list"
              ><fa-icon [icon]="faList" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleOrderedList().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-blue-100]="editor.isActive('orderedList')"
                [class.dark:bg-blue-900]="editor.isActive('orderedList')"
                [class.text-gray-600]="!editor.isActive('orderedList')"
                [class.dark:text-gray-300]="!editor.isActive('orderedList')"
                [class.hover:bg-gray-200]="!editor.isActive('orderedList')"
                [class.dark:hover:bg-gray-700]="!editor.isActive('orderedList')"
                title="Numbered list"
              ><fa-icon [icon]="faListOl" size="sm" /></button>
              <button
                (mousedown)="$event.preventDefault(); editor.chain().focus().toggleTaskList().run()"
                class="rounded px-1.5 py-0.5"
                [class.bg-blue-100]="editor.isActive('taskList')"
                [class.dark:bg-blue-900]="editor.isActive('taskList')"
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
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

  private sectionSvc = inject(SectionService);
  private noteSvc = inject(NoteService);
  private state = inject(ShellStateService);

  protected notebooks = this.state.notebooks;
  protected sections = signal<SectionDto[]>([]);

  protected title = '';
  protected selectedNotebookId: number | '' = '';
  protected selectedSectionId: number | '' = '';

  // Icons
  protected faBold = faBold;
  protected faItalic = faItalic;
  protected faUnderline = faUnderline;
  protected faStrikethrough = faStrikethrough;
  protected faList = faList;
  protected faListOl = faListOl;
  protected faSquareCheck = faSquareCheck;

  // Mini TipTap editor
  protected editor: Editor | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) return;

      this.title = '';
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
    this.loadSections(notebookId);
  }

  protected onClose(): void {
    this.destroyEditor();
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
}
