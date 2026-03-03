import {
  Component,
  OnDestroy,
  input,
  output,
  signal,
  effect,
  viewChild,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { SlashCommandExtension } from './slash-command.extension';
import type { SlashCommandItem, SlashCommandStorage, SlashSuggestionCallbackProps } from './slash-command.extension';
import { SlashCommandMenu } from '../slash-command-menu';
import type { SlashCommand } from '../slash-command-menu';
import { TableToolbar } from '../table-toolbar';

/**
 * Transforms old contenteditable todo HTML to TipTap's task list format.
 * Old: <ul class="todo-list"><li data-checked="false"><input type="checkbox"><span>text</span></li></ul>
 * New: <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>text</p></li></ul>
 * Idempotent — safe to run on already-migrated content.
 */
function migrateOldTodoHtml(html: string): string {
  if (!html || !html.includes('todo-list')) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const todoLists = doc.querySelectorAll('ul.todo-list');

  todoLists.forEach((ul) => {
    ul.removeAttribute('class');
    ul.setAttribute('data-type', 'taskList');

    ul.querySelectorAll(':scope > li').forEach((li) => {
      li.setAttribute('data-type', 'taskItem');

      // Remove the checkbox input
      const checkbox = li.querySelector(':scope > input[type="checkbox"]');
      if (checkbox) {
        checkbox.remove();
      }

      // Convert <span>text</span> to <p>text</p>
      const span = li.querySelector(':scope > span');
      if (span) {
        const p = doc.createElement('p');
        p.innerHTML = span.innerHTML;
        li.replaceChild(p, span);
      } else if (!li.querySelector(':scope > p')) {
        // If no span and no p, wrap text content in p
        const p = doc.createElement('p');
        p.innerHTML = li.innerHTML;
        li.innerHTML = '';
        li.appendChild(p);
      }
    });
  });

  return doc.body.innerHTML;
}

function getSlashStorage(editor: Editor): SlashCommandStorage {
  return (editor.storage as unknown as Record<string, SlashCommandStorage>)['slashCommand'];
}

@Component({
  selector: 'app-tiptap-editor',
  imports: [TiptapEditorDirective, SlashCommandMenu, TableToolbar],
  host: { class: 'relative flex min-h-0 min-w-0 flex-1 flex-col' },
  template: `
    <div
      class="noteflow-editor min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-gray-700 focus:outline-none dark:text-gray-200"
      tiptap
      [editor]="editor"
    ></div>

    <!-- Bubble menu (appears on text selection) -->
    @if (bubbleMenuVisible()) {
      <div
        class="bubble-menu fixed z-50 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        [style.top.px]="bubbleMenuPosition().top"
        [style.left.px]="bubbleMenuPosition().left"
      >
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleBold().run()"
          class="rounded px-2 py-1 text-sm font-bold"
          [class.bg-blue-100]="editor.isActive('bold')"
          [class.dark:bg-blue-900]="editor.isActive('bold')"
          [class.text-gray-700]="!editor.isActive('bold')"
          [class.dark:text-gray-200]="!editor.isActive('bold')"
          [class.hover:bg-gray-100]="!editor.isActive('bold')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('bold')"
          title="Bold"
        >B</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleItalic().run()"
          class="rounded px-2 py-1 text-sm italic"
          [class.bg-blue-100]="editor.isActive('italic')"
          [class.dark:bg-blue-900]="editor.isActive('italic')"
          [class.text-gray-700]="!editor.isActive('italic')"
          [class.dark:text-gray-200]="!editor.isActive('italic')"
          [class.hover:bg-gray-100]="!editor.isActive('italic')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('italic')"
          title="Italic"
        >I</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleUnderline().run()"
          class="rounded px-2 py-1 text-sm underline"
          [class.bg-blue-100]="editor.isActive('underline')"
          [class.dark:bg-blue-900]="editor.isActive('underline')"
          [class.text-gray-700]="!editor.isActive('underline')"
          [class.dark:text-gray-200]="!editor.isActive('underline')"
          [class.hover:bg-gray-100]="!editor.isActive('underline')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('underline')"
          title="Underline"
        >U</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleStrike().run()"
          class="rounded px-2 py-1 text-sm line-through"
          [class.bg-blue-100]="editor.isActive('strike')"
          [class.dark:bg-blue-900]="editor.isActive('strike')"
          [class.text-gray-700]="!editor.isActive('strike')"
          [class.dark:text-gray-200]="!editor.isActive('strike')"
          [class.hover:bg-gray-100]="!editor.isActive('strike')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('strike')"
          title="Strikethrough"
        >S</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleCode().run()"
          class="rounded px-2 py-1 font-mono text-sm"
          [class.bg-blue-100]="editor.isActive('code')"
          [class.dark:bg-blue-900]="editor.isActive('code')"
          [class.text-gray-700]="!editor.isActive('code')"
          [class.dark:text-gray-200]="!editor.isActive('code')"
          [class.hover:bg-gray-100]="!editor.isActive('code')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('code')"
          title="Inline code"
        >&lt;/&gt;</button>
      </div>
    }

    <!-- Slash command menu -->
    @if (slashMenuOpen()) {
      <app-slash-command-menu
        [filter]="slashFilter()"
        [position]="slashMenuPosition()"
        (selected)="onSlashCommandSelected($event)"
        (dismissed)="closeSlashMenu()"
      />
    }

    <!-- Table toolbar (appears when cursor is inside a table) -->
    @if (tableToolbarVisible()) {
      <app-table-toolbar
        [position]="tableToolbarPosition()"
        (addRow)="editor.chain().focus().addRowAfter().run()"
        (deleteRow)="editor.chain().focus().deleteRow().run()"
        (addColumn)="editor.chain().focus().addColumnAfter().run()"
        (deleteColumn)="editor.chain().focus().deleteColumn().run()"
        (toggleHeader)="editor.chain().focus().toggleHeaderRow().run()"
        (deleteTable)="editor.chain().focus().deleteTable().run()"
      />
    }
  `,
})
export class TiptapEditor implements OnDestroy {
  content = input('');
  contentChanged = output<string>();
  blurred = output<void>();

  editor!: Editor;

  // Bubble menu state
  protected bubbleMenuVisible = signal(false);
  protected bubbleMenuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Table toolbar state
  protected tableToolbarVisible = signal(false);
  protected tableToolbarPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Slash menu state
  protected slashMenuOpen = signal(false);
  protected slashMenuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  protected slashFilter = signal('');
  private slashMenu = viewChild(SlashCommandMenu);
  private slashSuggestionProps: SlashSuggestionCallbackProps | null = null;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: false }),
        Table.configure({ resizable: false }),
        TableRow,
        TableCell,
        TableHeader,
        Placeholder.configure({
          placeholder: ({ node, pos }) => {
            if (pos === 0) return "Start typing, or press '/' for commands\u2026";
            if (node.type.name === 'heading') return 'Heading';
            return "Type '/' for commands\u2026";
          },
          showOnlyCurrent: true,
        }),
        SlashCommandExtension,
      ],
      content: '',
      onUpdate: ({ editor }) => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.contentChanged.emit(editor.getHTML());
        }, 300);
      },
      onBlur: () => {
        this.blurred.emit();
        this.hideBubbleMenu();
        this.tableToolbarVisible.set(false);
      },
      onSelectionUpdate: ({ editor }) => {
        this.updateBubbleMenu(editor);
        this.updateTableToolbar(editor);
      },
    });

    // Register slash command callbacks
    const storage = getSlashStorage(this.editor);

    storage.onOpen = (props: SlashSuggestionCallbackProps) => {
      this.slashSuggestionProps = props;
      this.updateSlashMenuPosition(props);
      this.slashFilter.set('');
      this.slashMenuOpen.set(true);
    };

    storage.onUpdate = (props: SlashSuggestionCallbackProps) => {
      this.slashSuggestionProps = props;
      this.updateSlashMenuPosition(props);
      this.slashFilter.set(props.query);
    };

    storage.onClose = () => {
      this.closeSlashMenu();
    };

    storage.onKeyDown = (event: KeyboardEvent): boolean => {
      const menu = this.slashMenu();
      if (!menu) return false;

      if (event.key === 'ArrowDown') {
        menu.moveDown();
        return true;
      }
      if (event.key === 'ArrowUp') {
        menu.moveUp();
        return true;
      }
      if (event.key === 'Enter') {
        menu.selectCurrent();
        return true;
      }
      return false;
    };

    // Sync content input to editor
    effect(() => {
      const html = this.content();
      if (this.editor && !this.editor.isDestroyed) {
        const migrated = migrateOldTodoHtml(html);
        this.editor.commands.setContent(migrated, { emitUpdate: false });
      }
    });
  }

  setContent(html: string): void {
    if (this.editor && !this.editor.isDestroyed) {
      const migrated = migrateOldTodoHtml(html);
      this.editor.commands.setContent(migrated, { emitUpdate: false });
    }
  }

  getHTML(): string {
    return this.editor?.getHTML() ?? '';
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.editor?.destroy();
  }

  // ── Bubble menu ──────────────────────────────────────────────

  private updateBubbleMenu(editor: Editor): void {
    const { from, to, empty } = editor.state.selection;

    if (empty || from === to) {
      this.hideBubbleMenu();
      return;
    }

    // Get the DOM range for positioning
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      this.hideBubbleMenu();
      return;
    }

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0) {
      this.hideBubbleMenu();
      return;
    }

    const menuWidth = 220;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - menuWidth / 2, window.innerWidth - menuWidth - 8));
    const top = rect.top - 44;

    this.bubbleMenuPosition.set({ top, left });
    this.bubbleMenuVisible.set(true);
  }

  private hideBubbleMenu(): void {
    this.bubbleMenuVisible.set(false);
  }

  // ── Table toolbar ─────────────────────────────────────────────

  private updateTableToolbar(editor: Editor): void {
    if (!editor.isActive('table')) {
      this.tableToolbarVisible.set(false);
      return;
    }

    // Find the table DOM element closest to the current selection
    const { $from } = editor.state.selection;
    let depth = $from.depth;
    while (depth > 0 && $from.node(depth).type.name !== 'table') {
      depth--;
    }
    if (depth === 0) {
      this.tableToolbarVisible.set(false);
      return;
    }

    const tableStart = $from.start(depth) - 1;
    const domNode = editor.view.nodeDOM(tableStart);
    if (!(domNode instanceof HTMLElement)) {
      this.tableToolbarVisible.set(false);
      return;
    }

    const tableRect = domNode.getBoundingClientRect();
    const toolbarWidth = 380;
    const left = Math.max(8, Math.min(
      tableRect.left + tableRect.width / 2 - toolbarWidth / 2,
      window.innerWidth - toolbarWidth - 8,
    ));
    const top = tableRect.top - 36;

    this.tableToolbarPosition.set({ top, left });
    this.tableToolbarVisible.set(true);
  }

  // ── Slash menu ───────────────────────────────────────────────

  private updateSlashMenuPosition(props: SlashSuggestionCallbackProps): void {
    const rect = props.clientRect?.();
    if (!rect) return;

    const menuHeight = 260;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight + gap
      ? rect.top - menuHeight - gap
      : rect.bottom + gap;

    const left = Math.min(rect.left, window.innerWidth - 200);
    this.slashMenuPosition.set({ top, left });
  }

  protected onSlashCommandSelected(command: SlashCommand): void {
    if (this.slashSuggestionProps) {
      this.slashSuggestionProps.command({
        id: command.id,
        label: command.label,
        description: command.description,
      });
    }
    this.closeSlashMenu();
  }

  protected closeSlashMenu(): void {
    this.slashMenuOpen.set(false);
    this.slashFilter.set('');
    this.slashSuggestionProps = null;
  }
}
