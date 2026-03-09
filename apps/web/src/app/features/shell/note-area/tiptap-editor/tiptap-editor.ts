import {
  Component,
  OnDestroy,
  inject,
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
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { FileHandler } from '@tiptap/extension-file-handler';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faRotateLeft,
  faRotateRight,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faCode,
  faList,
  faListOl,
  faSquareCheck,
  faQuoteLeft,
  faLaptopCode,
  faMinus,
  faTableCells,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faIndent,
  faOutdent,
  faSuperscript,
  faSubscript,
  faLink,
  faLinkSlash,
  faFont,
  faHighlighter,
  faDroplet,
  faEraser,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { ImageService } from '../../../../core/services/image.service';
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
  imports: [TiptapEditorDirective, FaIconComponent, SlashCommandMenu, TableToolbar],
  host: { class: 'relative flex min-h-0 min-w-0 flex-1 flex-col' },
  template: `
    <!-- Formatting toolbar -->
    @if (showToolbar()) {
      <div class="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
        <!-- Undo / Redo -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().undo().run()"
          class="rounded px-1.5 py-1 text-gray-600 dark:text-gray-300"
          [class.opacity-30]="!editor.can().undo()"
          [class.cursor-default]="!editor.can().undo()"
          [class.hover:bg-gray-100]="editor.can().undo()"
          [class.dark:hover:bg-gray-700]="editor.can().undo()"
          title="Undo"
        ><fa-icon [icon]="faRotateLeft" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().redo().run()"
          class="rounded px-1.5 py-1 text-gray-600 dark:text-gray-300"
          [class.opacity-30]="!editor.can().redo()"
          [class.cursor-default]="!editor.can().redo()"
          [class.hover:bg-gray-100]="editor.can().redo()"
          [class.dark:hover:bg-gray-700]="editor.can().redo()"
          title="Redo"
        ><fa-icon [icon]="faRotateRight" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Text style -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().setParagraph().run()"
          class="rounded px-1.5 py-1 text-sm"
          [class.bg-blue-100]="editor.isActive('paragraph') && !editor.isActive('heading')"
          [class.dark:bg-blue-900]="editor.isActive('paragraph') && !editor.isActive('heading')"
          [class.text-gray-600]="editor.isActive('heading')"
          [class.dark:text-gray-300]="editor.isActive('heading')"
          [class.hover:bg-gray-100]="editor.isActive('heading')"
          [class.dark:hover:bg-gray-700]="editor.isActive('heading')"
          title="Paragraph"
        >&para;</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run()"
          class="rounded px-1.5 py-1 text-sm font-bold"
          [class.bg-blue-100]="editor.isActive('heading', { level: 1 })"
          [class.dark:bg-blue-900]="editor.isActive('heading', { level: 1 })"
          [class.text-gray-600]="!editor.isActive('heading', { level: 1 })"
          [class.dark:text-gray-300]="!editor.isActive('heading', { level: 1 })"
          [class.hover:bg-gray-100]="!editor.isActive('heading', { level: 1 })"
          [class.dark:hover:bg-gray-700]="!editor.isActive('heading', { level: 1 })"
          title="Heading 1"
        >H1</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run()"
          class="rounded px-1.5 py-1 text-sm font-bold"
          [class.bg-blue-100]="editor.isActive('heading', { level: 2 })"
          [class.dark:bg-blue-900]="editor.isActive('heading', { level: 2 })"
          [class.text-gray-600]="!editor.isActive('heading', { level: 2 })"
          [class.dark:text-gray-300]="!editor.isActive('heading', { level: 2 })"
          [class.hover:bg-gray-100]="!editor.isActive('heading', { level: 2 })"
          [class.dark:hover:bg-gray-700]="!editor.isActive('heading', { level: 2 })"
          title="Heading 2"
        >H2</button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run()"
          class="rounded px-1.5 py-1 text-sm font-bold"
          [class.bg-blue-100]="editor.isActive('heading', { level: 3 })"
          [class.dark:bg-blue-900]="editor.isActive('heading', { level: 3 })"
          [class.text-gray-600]="!editor.isActive('heading', { level: 3 })"
          [class.dark:text-gray-300]="!editor.isActive('heading', { level: 3 })"
          [class.hover:bg-gray-100]="!editor.isActive('heading', { level: 3 })"
          [class.dark:hover:bg-gray-700]="!editor.isActive('heading', { level: 3 })"
          title="Heading 3"
        >H3</button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Inline formatting -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleBold().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('bold')"
          [class.dark:bg-blue-900]="editor.isActive('bold')"
          [class.text-gray-600]="!editor.isActive('bold')"
          [class.dark:text-gray-300]="!editor.isActive('bold')"
          [class.hover:bg-gray-100]="!editor.isActive('bold')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('bold')"
          title="Bold"
        ><fa-icon [icon]="faBold" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleItalic().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('italic')"
          [class.dark:bg-blue-900]="editor.isActive('italic')"
          [class.text-gray-600]="!editor.isActive('italic')"
          [class.dark:text-gray-300]="!editor.isActive('italic')"
          [class.hover:bg-gray-100]="!editor.isActive('italic')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('italic')"
          title="Italic"
        ><fa-icon [icon]="faItalic" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleUnderline().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('underline')"
          [class.dark:bg-blue-900]="editor.isActive('underline')"
          [class.text-gray-600]="!editor.isActive('underline')"
          [class.dark:text-gray-300]="!editor.isActive('underline')"
          [class.hover:bg-gray-100]="!editor.isActive('underline')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('underline')"
          title="Underline"
        ><fa-icon [icon]="faUnderline" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleStrike().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('strike')"
          [class.dark:bg-blue-900]="editor.isActive('strike')"
          [class.text-gray-600]="!editor.isActive('strike')"
          [class.dark:text-gray-300]="!editor.isActive('strike')"
          [class.hover:bg-gray-100]="!editor.isActive('strike')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('strike')"
          title="Strikethrough"
        ><fa-icon [icon]="faStrikethrough" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleCode().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('code')"
          [class.dark:bg-blue-900]="editor.isActive('code')"
          [class.text-gray-600]="!editor.isActive('code')"
          [class.dark:text-gray-300]="!editor.isActive('code')"
          [class.hover:bg-gray-100]="!editor.isActive('code')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('code')"
          title="Inline code"
        ><fa-icon [icon]="faCode" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Highlight -->
        <div class="relative">
          <button
            (mousedown)="$event.preventDefault(); toggleHighlight(activeHighlightColor())"
            class="rounded px-1.5 py-1"
            [class.bg-blue-100]="editor.isActive('highlight')"
            [class.dark:bg-blue-900]="editor.isActive('highlight')"
            [class.text-gray-600]="!editor.isActive('highlight')"
            [class.dark:text-gray-300]="!editor.isActive('highlight')"
            [class.hover:bg-gray-100]="!editor.isActive('highlight')"
            [class.dark:hover:bg-gray-700]="!editor.isActive('highlight')"
            title="Highlight"
          >
            <fa-icon [icon]="faHighlighter" size="sm" />
            <span class="absolute bottom-0.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full" [style.background]="activeHighlightColor()"></span>
          </button>
        </div>
        <div class="relative">
          <button
            (mousedown)="$event.preventDefault(); highlightPickerOpen.set(!highlightPickerOpen())"
            class="rounded px-0.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Highlight colors"
          ><fa-icon [icon]="faDroplet" size="xs" /></button>
          @if (highlightPickerOpen()) {
            <div class="absolute left-0 top-full z-50 mt-1 flex gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              @for (color of highlightColors; track color.value) {
                <button
                  (mousedown)="$event.preventDefault(); applyHighlightColor(color.value)"
                  class="h-5 w-5 rounded-full border-2 transition-transform hover:scale-125"
                  [style.background]="color.value"
                  [class.border-blue-500]="activeHighlightColor() === color.value"
                  [class.border-transparent]="activeHighlightColor() !== color.value"
                  [title]="color.label"
                ></button>
              }
              <button
                (mousedown)="$event.preventDefault(); removeHighlight()"
                class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-transparent text-gray-400 transition-transform hover:scale-125 hover:text-red-500"
                title="Remove highlight"
              ><fa-icon [icon]="faEraser" size="xs" /></button>
            </div>
          }
        </div>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Superscript / Subscript -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleSuperscript().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('superscript')"
          [class.dark:bg-blue-900]="editor.isActive('superscript')"
          [class.text-gray-600]="!editor.isActive('superscript')"
          [class.dark:text-gray-300]="!editor.isActive('superscript')"
          [class.hover:bg-gray-100]="!editor.isActive('superscript')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('superscript')"
          title="Superscript"
        ><fa-icon [icon]="faSuperscript" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleSubscript().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('subscript')"
          [class.dark:bg-blue-900]="editor.isActive('subscript')"
          [class.text-gray-600]="!editor.isActive('subscript')"
          [class.dark:text-gray-300]="!editor.isActive('subscript')"
          [class.hover:bg-gray-100]="!editor.isActive('subscript')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('subscript')"
          title="Subscript"
        ><fa-icon [icon]="faSubscript" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Alignment -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().setTextAlign('left').run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="isAlignActive('left')"
          [class.dark:bg-blue-900]="isAlignActive('left')"
          [class.text-gray-600]="!isAlignActive('left')"
          [class.dark:text-gray-300]="!isAlignActive('left')"
          [class.hover:bg-gray-100]="!isAlignActive('left')"
          [class.dark:hover:bg-gray-700]="!isAlignActive('left')"
          title="Align left"
        ><fa-icon [icon]="faAlignLeft" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().setTextAlign('center').run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="isAlignActive('center')"
          [class.dark:bg-blue-900]="isAlignActive('center')"
          [class.text-gray-600]="!isAlignActive('center')"
          [class.dark:text-gray-300]="!isAlignActive('center')"
          [class.hover:bg-gray-100]="!isAlignActive('center')"
          [class.dark:hover:bg-gray-700]="!isAlignActive('center')"
          title="Align center"
        ><fa-icon [icon]="faAlignCenter" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().setTextAlign('right').run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="isAlignActive('right')"
          [class.dark:bg-blue-900]="isAlignActive('right')"
          [class.text-gray-600]="!isAlignActive('right')"
          [class.dark:text-gray-300]="!isAlignActive('right')"
          [class.hover:bg-gray-100]="!isAlignActive('right')"
          [class.dark:hover:bg-gray-700]="!isAlignActive('right')"
          title="Align right"
        ><fa-icon [icon]="faAlignRight" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Lists -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleBulletList().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('bulletList')"
          [class.dark:bg-blue-900]="editor.isActive('bulletList')"
          [class.text-gray-600]="!editor.isActive('bulletList')"
          [class.dark:text-gray-300]="!editor.isActive('bulletList')"
          [class.hover:bg-gray-100]="!editor.isActive('bulletList')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('bulletList')"
          title="Bullet list"
        ><fa-icon [icon]="faList" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleOrderedList().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('orderedList')"
          [class.dark:bg-blue-900]="editor.isActive('orderedList')"
          [class.text-gray-600]="!editor.isActive('orderedList')"
          [class.dark:text-gray-300]="!editor.isActive('orderedList')"
          [class.hover:bg-gray-100]="!editor.isActive('orderedList')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('orderedList')"
          title="Numbered list"
        ><fa-icon [icon]="faListOl" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleTaskList().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('taskList')"
          [class.dark:bg-blue-900]="editor.isActive('taskList')"
          [class.text-gray-600]="!editor.isActive('taskList')"
          [class.dark:text-gray-300]="!editor.isActive('taskList')"
          [class.hover:bg-gray-100]="!editor.isActive('taskList')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('taskList')"
          title="Todo list"
        ><fa-icon [icon]="faSquareCheck" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Indent / Outdent -->
        <button
          (mousedown)="$event.preventDefault(); liftListItemSafe()"
          class="rounded px-1.5 py-1 text-gray-600 dark:text-gray-300"
          [class.opacity-30]="!canLiftListItem()"
          [class.cursor-default]="!canLiftListItem()"
          [class.hover:bg-gray-100]="canLiftListItem()"
          [class.dark:hover:bg-gray-700]="canLiftListItem()"
          title="Outdent"
        ><fa-icon [icon]="faOutdent" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); sinkListItemSafe()"
          class="rounded px-1.5 py-1 text-gray-600 dark:text-gray-300"
          [class.opacity-30]="!canSinkListItem()"
          [class.cursor-default]="!canSinkListItem()"
          [class.hover:bg-gray-100]="canSinkListItem()"
          [class.dark:hover:bg-gray-700]="canSinkListItem()"
          title="Indent"
        ><fa-icon [icon]="faIndent" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Block types -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleBlockquote().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('blockquote')"
          [class.dark:bg-blue-900]="editor.isActive('blockquote')"
          [class.text-gray-600]="!editor.isActive('blockquote')"
          [class.dark:text-gray-300]="!editor.isActive('blockquote')"
          [class.hover:bg-gray-100]="!editor.isActive('blockquote')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('blockquote')"
          title="Quote"
        ><fa-icon [icon]="faQuoteLeft" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().toggleCodeBlock().run()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('codeBlock')"
          [class.dark:bg-blue-900]="editor.isActive('codeBlock')"
          [class.text-gray-600]="!editor.isActive('codeBlock')"
          [class.dark:text-gray-300]="!editor.isActive('codeBlock')"
          [class.hover:bg-gray-100]="!editor.isActive('codeBlock')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('codeBlock')"
          title="Code block"
        ><fa-icon [icon]="faLaptopCode" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().setHorizontalRule().run()"
          class="rounded px-1.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Divider"
        ><fa-icon [icon]="faMinus" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Link -->
        <button
          (mousedown)="$event.preventDefault(); toggleLink()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="editor.isActive('link')"
          [class.dark:bg-blue-900]="editor.isActive('link')"
          [class.text-gray-600]="!editor.isActive('link')"
          [class.dark:text-gray-300]="!editor.isActive('link')"
          [class.hover:bg-gray-100]="!editor.isActive('link')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('link')"
          title="Insert/edit link"
        ><fa-icon [icon]="faLink" size="sm" /></button>
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().unsetLink().run()"
          class="rounded px-1.5 py-1 text-gray-600 dark:text-gray-300"
          [class.opacity-30]="!editor.isActive('link')"
          [class.cursor-default]="!editor.isActive('link')"
          [class.hover:bg-gray-100]="editor.isActive('link')"
          [class.dark:hover:bg-gray-700]="editor.isActive('link')"
          title="Remove link"
        ><fa-icon [icon]="faLinkSlash" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Table -->
        <button
          (mousedown)="$event.preventDefault(); editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
          class="rounded px-1.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Insert table"
        ><fa-icon [icon]="faTableCells" size="sm" /></button>

        <!-- Image -->
        <button
          (mousedown)="$event.preventDefault(); insertImage()"
          class="rounded px-1.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Insert image"
        ><fa-icon [icon]="faImage" size="sm" /></button>

        <div class="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600"></div>

        <!-- Font toggle -->
        <button
          (mousedown)="$event.preventDefault(); toggleSerif()"
          class="rounded px-1.5 py-1"
          [class.bg-blue-100]="serifMode()"
          [class.dark:bg-blue-900]="serifMode()"
          [class.text-gray-600]="!serifMode()"
          [class.dark:text-gray-300]="!serifMode()"
          [class.hover:bg-gray-100]="!serifMode()"
          [class.dark:hover:bg-gray-700]="!serifMode()"
          title="Toggle serif font"
        ><fa-icon [icon]="faFont" size="sm" /></button>
      </div>
    }

    <div
      class="noteflow-editor min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-gray-700 focus:outline-none dark:text-gray-200"
      [class.serif-mode]="serifMode()"
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
        <div class="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600"></div>
        <button
          (mousedown)="$event.preventDefault(); toggleLink()"
          class="rounded px-2 py-1 text-sm"
          [class.bg-blue-100]="editor.isActive('link')"
          [class.dark:bg-blue-900]="editor.isActive('link')"
          [class.text-gray-700]="!editor.isActive('link')"
          [class.dark:text-gray-200]="!editor.isActive('link')"
          [class.hover:bg-gray-100]="!editor.isActive('link')"
          [class.dark:hover:bg-gray-700]="!editor.isActive('link')"
          title="Insert/edit link"
        ><fa-icon [icon]="faLink" size="sm" /></button>
        <div class="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600"></div>
        <div class="relative">
          <button
            (mousedown)="$event.preventDefault(); bubbleHighlightOpen.set(!bubbleHighlightOpen())"
            class="rounded px-2 py-1 text-sm"
            [class.bg-blue-100]="editor.isActive('highlight')"
            [class.dark:bg-blue-900]="editor.isActive('highlight')"
            [class.text-gray-700]="!editor.isActive('highlight')"
            [class.dark:text-gray-200]="!editor.isActive('highlight')"
            [class.hover:bg-gray-100]="!editor.isActive('highlight')"
            [class.dark:hover:bg-gray-700]="!editor.isActive('highlight')"
            title="Highlight"
          ><fa-icon [icon]="faHighlighter" size="sm" /></button>
          @if (bubbleHighlightOpen()) {
            <div class="absolute bottom-full left-1/2 z-50 mb-1 flex -translate-x-1/2 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              @for (color of highlightColors; track color.value) {
                <button
                  (mousedown)="$event.preventDefault(); applyHighlightFromBubble(color.value)"
                  class="h-5 w-5 rounded-full border-2 transition-transform hover:scale-125"
                  [style.background]="color.value"
                  [class.border-blue-500]="activeHighlightColor() === color.value"
                  [class.border-transparent]="activeHighlightColor() !== color.value"
                  [title]="color.label"
                ></button>
              }
              <button
                (mousedown)="$event.preventDefault(); removeHighlightFromBubble()"
                class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-transparent text-gray-400 transition-transform hover:scale-125 hover:text-red-500"
                title="Remove highlight"
              ><fa-icon [icon]="faEraser" size="xs" /></button>
            </div>
          }
        </div>
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
  noteId = input<number | null>(null);
  contentChanged = output<string>();
  contentUpdated = output<string>();
  blurred = output<void>();

  private imageService = inject(ImageService);
  editor!: Editor;

  // Toolbar state (persisted via localStorage)
  protected showToolbar = signal(localStorage.getItem('noteflow-toolbar') !== 'false');
  protected serifMode = signal(localStorage.getItem('noteflow-font-serif') === 'true');

  // Toolbar icons
  protected faRotateLeft = faRotateLeft;
  protected faRotateRight = faRotateRight;
  protected faBold = faBold;
  protected faItalic = faItalic;
  protected faUnderline = faUnderline;
  protected faStrikethrough = faStrikethrough;
  protected faCode = faCode;
  protected faList = faList;
  protected faListOl = faListOl;
  protected faSquareCheck = faSquareCheck;
  protected faQuoteLeft = faQuoteLeft;
  protected faLaptopCode = faLaptopCode;
  protected faMinus = faMinus;
  protected faTableCells = faTableCells;
  protected faAlignLeft = faAlignLeft;
  protected faAlignCenter = faAlignCenter;
  protected faAlignRight = faAlignRight;
  protected faIndent = faIndent;
  protected faOutdent = faOutdent;
  protected faSuperscript = faSuperscript;
  protected faSubscript = faSubscript;
  protected faLink = faLink;
  protected faLinkSlash = faLinkSlash;
  protected faFont = faFont;
  protected faHighlighter = faHighlighter;
  protected faDroplet = faDroplet;
  protected faEraser = faEraser;
  protected faImage = faImage;

  toggleToolbar(): void {
    const next = !this.showToolbar();
    this.showToolbar.set(next);
    localStorage.setItem('noteflow-toolbar', String(next));
  }

  protected toggleSerif(): void {
    const next = !this.serifMode();
    this.serifMode.set(next);
    localStorage.setItem('noteflow-font-serif', String(next));
  }

  // Highlight colors
  protected highlightColors = [
    { value: '#fde047', label: 'Yellow' },
    { value: '#86efac', label: 'Green' },
    { value: '#93c5fd', label: 'Blue' },
    { value: '#fca5a5', label: 'Red' },
    { value: '#fdba74', label: 'Orange' },
    { value: '#d8b4fe', label: 'Purple' },
  ];
  protected highlightPickerOpen = signal(false);
  protected bubbleHighlightOpen = signal(false);
  protected activeHighlightColor = signal('#fde047');

  protected toggleHighlight(color: string): void {
    this.editor.chain().focus().toggleHighlight({ color }).run();
  }

  protected applyHighlightColor(color: string): void {
    this.activeHighlightColor.set(color);
    this.editor.chain().focus().toggleHighlight({ color }).run();
    this.highlightPickerOpen.set(false);
  }

  protected removeHighlight(): void {
    this.editor.chain().focus().unsetHighlight().run();
    this.highlightPickerOpen.set(false);
  }

  protected applyHighlightFromBubble(color: string): void {
    this.activeHighlightColor.set(color);
    this.editor.chain().focus().toggleHighlight({ color }).run();
    this.bubbleHighlightOpen.set(false);
  }

  protected removeHighlightFromBubble(): void {
    this.editor.chain().focus().unsetHighlight().run();
    this.bubbleHighlightOpen.set(false);
  }

  isToolbarVisible(): boolean {
    return this.showToolbar();
  }

  protected isAlignActive(alignment: string): boolean {
    if (alignment === 'left') {
      return !this.editor.isActive({ textAlign: 'center' }) &&
             !this.editor.isActive({ textAlign: 'right' });
    }
    return this.editor.isActive({ textAlign: alignment });
  }

  protected canSinkListItem(): boolean {
    return this.editor.can().sinkListItem('listItem') ||
           this.editor.can().sinkListItem('taskItem');
  }

  protected canLiftListItem(): boolean {
    return this.editor.can().liftListItem('listItem') ||
           this.editor.can().liftListItem('taskItem');
  }

  protected sinkListItemSafe(): void {
    if (this.editor.can().sinkListItem('listItem'))
      this.editor.chain().focus().sinkListItem('listItem').run();
    else if (this.editor.can().sinkListItem('taskItem'))
      this.editor.chain().focus().sinkListItem('taskItem').run();
  }

  protected liftListItemSafe(): void {
    if (this.editor.can().liftListItem('listItem'))
      this.editor.chain().focus().liftListItem('listItem').run();
    else if (this.editor.can().liftListItem('taskItem'))
      this.editor.chain().focus().liftListItem('taskItem').run();
  }

  protected toggleLink(): void {
    const previousUrl = this.editor.getAttributes('link')['href'] || '';
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') { this.editor.chain().focus().unsetLink().run(); return; }
    this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  protected insertImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) this.uploadAndInsertImages([file]);
    };
    input.click();
  }

  private uploadAndInsertImages(files: File[]): void {
    const id = this.noteId();
    if (!id) return;

    for (const file of files) {
      this.imageService.upload(id, file).subscribe({
        next: (image) => {
          this.editor.chain().focus().setImage({ src: image.url }).run();
        },
        error: (err) => {
          console.error('Image upload failed:', err);
        },
      });
    }
  }

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
  private slashImageHandler: (() => void) | null = null;

  constructor() {
    this.editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: false }),
        TableRow,
        TableCell,
        TableHeader,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Superscript,
        Subscript,
        Highlight.configure({ multicolor: true }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        }),
        Placeholder.configure({
          placeholder: ({ node, pos }) => {
            if (pos === 0) return "Start typing, or press '/' for commands\u2026";
            if (node.type.name === 'heading') return 'Heading';
            return "Type '/' for commands\u2026";
          },
          showOnlyCurrent: true,
        }),
        SlashCommandExtension,
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        FileHandler.configure({
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          onDrop: (_editor, files) => {
            this.uploadAndInsertImages(files);
          },
          onPaste: (_editor, files) => {
            this.uploadAndInsertImages(files);
          },
        }),
      ],
      content: '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.contentUpdated.emit(html);
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.contentChanged.emit(html);
        }, 300);
      },
      onBlur: () => {
        this.blurred.emit();
        this.hideBubbleMenu();
        this.tableToolbarVisible.set(false);
        this.highlightPickerOpen.set(false);
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

    // Listen for slash-command image insertion
    this.slashImageHandler = () => this.insertImage();
    this.editor.view.dom.addEventListener('slash-insert-image', this.slashImageHandler);

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
    if (this.slashImageHandler) {
      this.editor?.view.dom.removeEventListener('slash-insert-image', this.slashImageHandler);
    }
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

    const menuWidth = 280;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - menuWidth / 2, window.innerWidth - menuWidth - 8));
    const top = rect.top - 44;

    this.bubbleMenuPosition.set({ top, left });
    this.bubbleMenuVisible.set(true);
  }

  private hideBubbleMenu(): void {
    this.bubbleMenuVisible.set(false);
    this.bubbleHighlightOpen.set(false);
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
