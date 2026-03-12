import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';

export interface SearchReplaceState {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
  currentIndex: number;
  results: Array<{ from: number; to: number }>;
}

const searchReplacePluginKey = new PluginKey('searchReplace');

type MetaAction =
  | { type: 'setSearchTerm'; term: string }
  | { type: 'setReplaceTerm'; term: string }
  | { type: 'setCaseSensitive'; caseSensitive: boolean }
  | { type: 'setCurrentIndex'; index: number }
  | { type: 'clearSearch' };

function findMatches(doc: PmNode, searchTerm: string, caseSensitive: boolean): Array<{ from: number; to: number }> {
  if (!searchTerm) return [];

  const results: Array<{ from: number; to: number }> = [];
  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  // Walk block-level nodes and concatenate text within each block
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return;

    // Build concatenated text and offset map for this block
    let blockText = '';
    const offsets: Array<{ nodePos: number; textStart: number; length: number }> = [];

    node.forEach((child, childOffset) => {
      if (child.isText && child.text) {
        offsets.push({
          nodePos: pos + 1 + childOffset, // +1 for the block node itself
          textStart: blockText.length,
          length: child.text.length,
        });
        blockText += child.text;
      }
    });

    const searchIn = caseSensitive ? blockText : blockText.toLowerCase();
    let idx = searchIn.indexOf(term);
    while (idx !== -1) {
      // Map back to document positions
      const matchStart = idx;
      const matchEnd = idx + term.length;

      // Find the document position for this match
      let docFrom = -1;
      let docTo = -1;

      for (const offset of offsets) {
        const nodeTextEnd = offset.textStart + offset.length;

        if (docFrom === -1 && matchStart >= offset.textStart && matchStart < nodeTextEnd) {
          docFrom = offset.nodePos + (matchStart - offset.textStart);
        }
        if (matchEnd > offset.textStart && matchEnd <= nodeTextEnd) {
          docTo = offset.nodePos + (matchEnd - offset.textStart);
          break;
        }
      }

      if (docFrom !== -1 && docTo !== -1) {
        results.push({ from: docFrom, to: docTo });
      }

      idx = searchIn.indexOf(term, idx + 1);
    }

    return false; // Don't descend into the block's children (we already walked them)
  });

  return results;
}

function recomputeState(
  doc: PmNode,
  prev: SearchReplaceState,
  overrides: Partial<SearchReplaceState>,
): SearchReplaceState {
  const searchTerm = overrides.searchTerm ?? prev.searchTerm;
  const caseSensitive = overrides.caseSensitive ?? prev.caseSensitive;
  const replaceTerm = overrides.replaceTerm ?? prev.replaceTerm;

  const results = findMatches(doc, searchTerm, caseSensitive);
  let currentIndex = overrides.currentIndex ?? prev.currentIndex;

  if (results.length === 0) {
    currentIndex = -1;
  } else if (currentIndex >= results.length) {
    currentIndex = 0;
  } else if (currentIndex < 0) {
    currentIndex = 0;
  }

  return { searchTerm, replaceTerm, caseSensitive, currentIndex, results };
}

const defaultState: SearchReplaceState = {
  searchTerm: '',
  replaceTerm: '',
  caseSensitive: false,
  currentIndex: -1,
  results: [],
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setReplaceTerm: (term: string) => ReturnType;
      setCaseSensitive: (caseSensitive: boolean) => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceCurrent: () => ReturnType;
      replaceAll: () => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export function getSearchState(editor: { state: unknown }): SearchReplaceState {
  return (searchReplacePluginKey.getState(editor.state as Parameters<typeof searchReplacePluginKey.getState>[0]) as SearchReplaceState | undefined) ?? defaultState;
}

export const SearchReplaceExtension = Extension.create({
  name: 'searchReplace',

  addStorage() {
    return {
      onOpenFind: null as (() => void) | null,
      onOpenFindReplace: null as (() => void) | null,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { type: 'setSearchTerm', term } satisfies MetaAction);
            dispatch(tr);
          }
          return true;
        },

      setReplaceTerm:
        (term: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { type: 'setReplaceTerm', term } satisfies MetaAction);
            dispatch(tr);
          }
          return true;
        },

      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { type: 'setCaseSensitive', caseSensitive } satisfies MetaAction);
            dispatch(tr);
          }
          return true;
        },

      findNext:
        () =>
        ({ tr, dispatch, state }) => {
          const pluginState = searchReplacePluginKey.getState(state) as SearchReplaceState | undefined;
          if (!pluginState || pluginState.results.length === 0) return false;

          const nextIndex = (pluginState.currentIndex + 1) % pluginState.results.length;
          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { type: 'setCurrentIndex', index: nextIndex } satisfies MetaAction);
            const match = pluginState.results[nextIndex];
            tr.setSelection(TextSelection.create(state.doc, match.from, match.to));
            tr.scrollIntoView();
            dispatch(tr);
          }
          return true;
        },

      findPrevious:
        () =>
        ({ tr, dispatch, state }) => {
          const pluginState = searchReplacePluginKey.getState(state) as SearchReplaceState | undefined;
          if (!pluginState || pluginState.results.length === 0) return false;

          const prevIndex = (pluginState.currentIndex - 1 + pluginState.results.length) % pluginState.results.length;
          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { type: 'setCurrentIndex', index: prevIndex } satisfies MetaAction);
            const match = pluginState.results[prevIndex];
            tr.setSelection(TextSelection.create(state.doc, match.from, match.to));
            tr.scrollIntoView();
            dispatch(tr);
          }
          return true;
        },

      replaceCurrent:
        () =>
        ({ tr, dispatch, state }) => {
          const pluginState = searchReplacePluginKey.getState(state) as SearchReplaceState | undefined;
          if (!pluginState || pluginState.results.length === 0 || pluginState.currentIndex < 0) return false;

          const match = pluginState.results[pluginState.currentIndex];
          if (dispatch) {
            tr.insertText(pluginState.replaceTerm, match.from, match.to);
            dispatch(tr);
          }
          return true;
        },

      replaceAll:
        () =>
        ({ tr, dispatch, state }) => {
          const pluginState = searchReplacePluginKey.getState(state) as SearchReplaceState | undefined;
          if (!pluginState || pluginState.results.length === 0) return false;

          if (dispatch) {
            // Replace in reverse order to preserve earlier positions
            const sorted = [...pluginState.results].sort((a, b) => b.from - a.from);
            for (const match of sorted) {
              tr.insertText(pluginState.replaceTerm, match.from, match.to);
            }
            dispatch(tr);
          }
          return true;
        },

      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(searchReplacePluginKey, { type: 'clearSearch' } satisfies MetaAction);
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-f': () => {
        this.storage.onOpenFind?.();
        return true;
      },
      'Mod-h': () => {
        this.storage.onOpenFindReplace?.();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchReplacePluginKey,

        state: {
          init: () => ({ ...defaultState }),
          apply: (tr, prev: SearchReplaceState) => {
            const meta = tr.getMeta(searchReplacePluginKey) as MetaAction | undefined;

            if (meta) {
              switch (meta.type) {
                case 'setSearchTerm':
                  return recomputeState(tr.doc, prev, { searchTerm: meta.term, currentIndex: 0 });
                case 'setReplaceTerm':
                  return { ...prev, replaceTerm: meta.term };
                case 'setCaseSensitive':
                  return recomputeState(tr.doc, prev, { caseSensitive: meta.caseSensitive, currentIndex: 0 });
                case 'setCurrentIndex':
                  return { ...prev, currentIndex: meta.index };
                case 'clearSearch':
                  return { ...defaultState };
              }
            }

            // If the document changed, recompute results
            if (tr.docChanged && prev.searchTerm) {
              return recomputeState(tr.doc, prev, {});
            }

            return prev;
          },
        },

        props: {
          decorations: (state) => {
            const pluginState = searchReplacePluginKey.getState(state) as SearchReplaceState | undefined;
            if (!pluginState || pluginState.results.length === 0) {
              return DecorationSet.empty;
            }

            const decorations = pluginState.results.map((match, i) => {
              const className = i === pluginState.currentIndex
                ? 'search-match search-match-current'
                : 'search-match';
              return Decoration.inline(match.from, match.to, { class: className });
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
