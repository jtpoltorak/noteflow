import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SectionService } from '../../../core/services/section.service';
import { NoteService } from '../../../core/services/note.service';
import { ShellStateService } from '../shell-state.service';
import type { SectionDto, NoteDto } from '@noteflow/shared-types';
import type { TreeNode } from './tree-node.model';

@Injectable()
export class TreeStateService {
  private state = inject(ShellStateService);
  private sectionSvc = inject(SectionService);
  private noteSvc = inject(NoteService);

  // ── Expansion state ─────────────────────────────────────────
  readonly expandedNotebooks = signal<Set<number>>(new Set());
  readonly expandedSections = signal<Set<number>>(new Set());

  // ── Caches ──────────────────────────────────────────────────
  readonly sectionCache = signal<Map<number, SectionDto[]>>(new Map());
  readonly noteCache = signal<Map<number, NoteDto[]>>(new Map());

  // ── Loading indicators ──────────────────────────────────────
  readonly loadingIds = signal<Set<string>>(new Set());

  // ── Inline create/rename state ──────────────────────────────
  readonly creatingUnder = signal<{ type: 'notebook' | 'section'; id: number } | null>(null);
  readonly editingNode = signal<{ type: 'notebook' | 'section' | 'note'; id: number } | null>(null);

  // ── Flat tree nodes ─────────────────────────────────────────
  readonly flatNodes = computed<TreeNode[]>(() => {
    const nodes: TreeNode[] = [];
    const notebooks = this.state.notebooks();
    const expanded = this.expandedNotebooks();
    const expandedSec = this.expandedSections();
    const secCache = this.sectionCache();
    const nCache = this.noteCache();

    for (let ni = 0; ni < notebooks.length; ni++) {
      const nb = notebooks[ni];
      const isLastNb = ni === notebooks.length - 1;

      nodes.push({
        id: nb.id,
        type: 'notebook',
        title: nb.title,
        level: 0,
        expandable: true,
        parentId: null,
        isLastChild: isLastNb,
      });

      if (expanded.has(nb.id)) {
        const sections = secCache.get(nb.id) ?? [];
        for (let si = 0; si < sections.length; si++) {
          const sec = sections[si];
          const isLastSec = si === sections.length - 1;

          nodes.push({
            id: sec.id,
            type: 'section',
            title: sec.title,
            level: 1,
            expandable: true,
            parentId: nb.id,
            isLastChild: isLastSec,
          });

          if (expandedSec.has(sec.id)) {
            const notes = nCache.get(sec.id) ?? [];
            for (let noi = 0; noi < notes.length; noi++) {
              const note = notes[noi];
              nodes.push({
                id: note.id,
                type: 'note',
                title: note.title,
                level: 2,
                expandable: false,
                parentId: sec.id,
                isLastChild: noi === notes.length - 1,
                parentIsLastChild: isLastSec,
                isLocked: note.isLocked,
                favoritedAt: note.favoritedAt,
              });
            }
          }
        }
      }
    }

    return nodes;
  });

  constructor() {
    // Sync tree caches when ShellStateService data changes from CRUD operations.
    // Gate on loading flags: when selectNoteFromSearch changes the selected ID,
    // loadSections/loadNotes set loading=true synchronously. The effect batches
    // all signal reads, so it sees loading=true and skips the stale cache write.
    // Once the fetch completes (loading=false), the data matches the selected ID.
    effect(() => {
      const sections = this.state.sections();
      const nbId = this.state.selectedNotebookId();
      const loading = this.state.loadingSections();
      if (nbId && sections.length > 0 && !loading) {
        this.sectionCache.update((m) => {
          const next = new Map(m);
          next.set(nbId, sections);
          return next;
        });
      }
    });

    effect(() => {
      const notes = this.state.notes();
      const secId = this.state.selectedSectionId();
      const loading = this.state.loadingNotes();
      if (secId && notes.length > 0 && !loading) {
        this.noteCache.update((m) => {
          const next = new Map(m);
          next.set(secId, notes);
          return next;
        });
      }
    });
  }

  // ── Toggle expand/collapse ──────────────────────────────────

  toggleNotebook(id: number): void {
    this.expandedNotebooks.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch sections if not cached
        if (!this.sectionCache().has(id)) {
          this.fetchSections(id);
        }
      }
      return next;
    });
  }

  toggleSection(id: number): void {
    this.expandedSections.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch notes if not cached
        if (!this.noteCache().has(id)) {
          this.fetchNotes(id);
        }
      }
      return next;
    });
  }

  // ── Selection ───────────────────────────────────────────────

  selectNode(node: TreeNode): void {
    if (node.type === 'notebook') {
      this.state.selectNotebook(node.id);
      // Auto-expand
      if (!this.expandedNotebooks().has(node.id)) {
        this.toggleNotebook(node.id);
      }
    } else if (node.type === 'section') {
      // Ensure notebook is selected
      if (node.parentId && this.state.selectedNotebookId() !== node.parentId) {
        this.state.selectedNotebookId.set(node.parentId);
      }
      this.state.selectSection(node.id);
      // Auto-expand
      if (!this.expandedSections().has(node.id)) {
        this.toggleSection(node.id);
      }
    } else if (node.type === 'note') {
      // Find parent section and notebook
      const secId = node.parentId;
      if (secId) {
        const nbId = this.findNotebookForSection(secId);
        if (nbId !== null) {
          this.state.selectedNotebookId.set(nbId);
          // Sync sections from tree cache so state.selectedSection() works
          const cachedSections = this.sectionCache().get(nbId);
          if (cachedSections) {
            this.state.sections.set(cachedSections);
          }
        }
        this.state.selectedSectionId.set(secId);
        // Sync notes from tree cache so the editor can find the note
        const cachedNotes = this.noteCache().get(secId);
        if (cachedNotes) {
          this.state.notes.set(cachedNotes);
        }
      }
      this.state.selectNote(node.id);
    }
  }

  // ── Cache invalidation ──────────────────────────────────────

  invalidateNotebookCache(notebookId: number): void {
    this.fetchSections(notebookId);
  }

  invalidateSectionCache(sectionId: number): void {
    this.fetchNotes(sectionId);
  }

  // ── Auto-expand to a specific note ──────────────────────────

  expandToNote(notebookId: number, sectionId: number): void {
    this.expandedNotebooks.update((s) => new Set(s).add(notebookId));
    this.expandedSections.update((s) => new Set(s).add(sectionId));
    if (!this.sectionCache().has(notebookId)) {
      this.fetchSections(notebookId);
    }
    if (!this.noteCache().has(sectionId)) {
      this.fetchNotes(sectionId);
    }
  }

  // ── Private helpers ─────────────────────────────────────────

  private fetchSections(notebookId: number): void {
    const key = `notebook-${notebookId}`;
    this.loadingIds.update((s) => new Set(s).add(key));
    this.sectionSvc.getByNotebook(notebookId).subscribe({
      next: (sections) => {
        this.sectionCache.update((m) => {
          const next = new Map(m);
          next.set(notebookId, sections);
          return next;
        });
        this.loadingIds.update((s) => {
          const next = new Set(s);
          next.delete(key);
          return next;
        });
      },
      error: () => {
        this.loadingIds.update((s) => {
          const next = new Set(s);
          next.delete(key);
          return next;
        });
      },
    });
  }

  private fetchNotes(sectionId: number): void {
    const key = `section-${sectionId}`;
    this.loadingIds.update((s) => new Set(s).add(key));
    this.noteSvc.getBySection(sectionId).subscribe({
      next: (notes) => {
        this.noteCache.update((m) => {
          const next = new Map(m);
          next.set(sectionId, notes);
          return next;
        });
        this.loadingIds.update((s) => {
          const next = new Set(s);
          next.delete(key);
          return next;
        });
      },
      error: () => {
        this.loadingIds.update((s) => {
          const next = new Set(s);
          next.delete(key);
          return next;
        });
      },
    });
  }

  private findNotebookForSection(sectionId: number): number | null {
    for (const [nbId, sections] of this.sectionCache()) {
      if (sections.some((s) => s.id === sectionId)) {
        return nbId;
      }
    }
    return null;
  }
}
