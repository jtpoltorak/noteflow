import { Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import type { Editor, Range } from '@tiptap/core';

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
}

export interface SlashCommandStorage {
  onOpen: ((props: SlashSuggestionCallbackProps) => void) | null;
  onUpdate: ((props: SlashSuggestionCallbackProps) => void) | null;
  onClose: (() => void) | null;
  onKeyDown: ((event: KeyboardEvent) => boolean) | null;
}

/** Simplified props passed to our callbacks */
export interface SlashSuggestionCallbackProps {
  editor: Editor;
  range: Range;
  query: string;
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  clientRect: (() => DOMRect | null) | null;
}

interface SlashCommandOptions {
  suggestion: {
    char: string;
    startOfLine: boolean;
    items: (args: { query: string }) => SlashCommandItem[];
    command: (args: { editor: Editor; range: Range; props: SlashCommandItem }) => void;
  };
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  { id: 'text', label: 'Text', description: 'Plain paragraph' },
  { id: 'heading1', label: 'Heading 1', description: 'Large heading' },
  { id: 'heading2', label: 'Heading 2', description: 'Medium heading' },
  { id: 'heading3', label: 'Heading 3', description: 'Small heading' },
  { id: 'bullet-list', label: 'Bulleted List', description: 'Unordered list' },
  { id: 'number-list', label: 'Numbered List', description: 'Ordered list' },
  { id: 'todo-list', label: 'Todo List', description: 'Checklist' },
  { id: 'quote', label: 'Quote', description: 'Block quote' },
  { id: 'code', label: 'Code Block', description: 'Code snippet' },
  { id: 'divider', label: 'Divider', description: 'Horizontal rule' },
  { id: 'table', label: 'Table', description: 'Insert a table' },
];

function executeSlashCommand(editor: Editor, range: Range, commandId: string): void {
  editor.chain().focus().deleteRange(range).run();

  switch (commandId) {
    case 'text':
      editor.chain().focus().setParagraph().run();
      break;
    case 'heading1':
      editor.chain().focus().toggleHeading({ level: 1 }).run();
      break;
    case 'heading2':
      editor.chain().focus().toggleHeading({ level: 2 }).run();
      break;
    case 'heading3':
      editor.chain().focus().toggleHeading({ level: 3 }).run();
      break;
    case 'bullet-list':
      editor.chain().focus().toggleBulletList().run();
      break;
    case 'number-list':
      editor.chain().focus().toggleOrderedList().run();
      break;
    case 'todo-list':
      editor.chain().focus().toggleTaskList().run();
      break;
    case 'quote':
      editor.chain().focus().toggleBlockquote().run();
      break;
    case 'code':
      editor.chain().focus().toggleCodeBlock().run();
      break;
    case 'divider':
      editor.chain().focus().setHorizontalRule().run();
      break;
    case 'table':
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      break;
  }
}

function getStorage(editor: Editor): SlashCommandStorage {
  return (editor.storage as unknown as Record<string, SlashCommandStorage>)['slashCommand'];
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions, SlashCommandStorage>({
  name: 'slashCommand',

  addStorage() {
    return {
      onOpen: null,
      onUpdate: null,
      onClose: null,
      onKeyDown: null,
    };
  },

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        items: ({ query }: { query: string }): SlashCommandItem[] => {
          if (!query) return SLASH_COMMANDS;
          const q = query.toLowerCase();
          return SLASH_COMMANDS.filter(
            (cmd) =>
              cmd.label.toLowerCase().includes(q) ||
              cmd.description.toLowerCase().includes(q),
          );
        },
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommandItem;
        }) => {
          executeSlashCommand(editor, range, props.id);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        ...this.options.suggestion,
        render: () => {
          return {
            onStart: (props) => {
              getStorage(props.editor).onOpen?.(props as SlashSuggestionCallbackProps);
            },
            onUpdate: (props) => {
              getStorage(props.editor).onUpdate?.(props as SlashSuggestionCallbackProps);
            },
            onKeyDown: ({ event }) => {
              if (event.key === 'Escape') {
                getStorage(this.editor).onClose?.();
                return true;
              }
              return getStorage(this.editor).onKeyDown?.(event) ?? false;
            },
            onExit: () => {
              getStorage(this.editor).onClose?.();
            },
          };
        },
      }),
    ];
  },
});
