import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface NoteLinkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteLink: {
      setNoteLink: (attrs: { noteId: number; noteTitle: string }) => ReturnType;
      unsetNoteLink: () => ReturnType;
    };
  }
}

export const NoteLink = Mark.create<NoteLinkOptions>({
  name: 'noteLink',

  priority: 1001, // Higher than Link to take precedence on parse

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => Number(el.getAttribute('data-note-id')),
        renderHTML: (attrs) => ({ 'data-note-id': attrs['noteId'] as number }),
      },
      noteTitle: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-note-title'),
        renderHTML: (attrs) => ({ 'data-note-title': attrs['noteTitle'] as string }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-note-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const noteId = HTMLAttributes['data-note-id'];
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        href: `noteflow://note/${noteId}`,
        class: 'note-link',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setNoteLink:
        (attrs) =>
        ({ chain }) => {
          return chain().setMark(this.name, attrs).run();
        },
      unsetNoteLink:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('noteLinkClick'),
        props: {
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            const link = target.closest('a.note-link');
            if (!link) return false;

            const noteId = link.getAttribute('data-note-id');
            if (!noteId) return false;

            event.preventDefault();
            event.stopPropagation();

            view.dom.dispatchEvent(
              new CustomEvent('note-link-clicked', {
                bubbles: true,
                detail: { noteId: Number(noteId) },
              }),
            );
            return true;
          },
        },
      }),
    ];
  },
});
