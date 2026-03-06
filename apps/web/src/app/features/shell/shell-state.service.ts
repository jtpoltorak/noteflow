import { Injectable, inject, signal, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotebookService } from '../../core/services/notebook.service';
import { SectionService } from '../../core/services/section.service';
import { NoteService } from '../../core/services/note.service';
import type { NotebookDto, SectionDto, NoteDto } from '@noteflow/shared-types';

@Injectable()
export class ShellStateService {
  private notebookSvc = inject(NotebookService);
  private sectionSvc = inject(SectionService);
  private noteSvc = inject(NoteService);

  // ── Data arrays ───────────────────────────────────────────────
  readonly notebooks = signal<NotebookDto[]>([]);
  readonly sections = signal<SectionDto[]>([]);
  readonly notes = signal<NoteDto[]>([]);

  // ── Selection IDs ─────────────────────────────────────────────
  readonly selectedNotebookId = signal<number | null>(null);
  readonly selectedSectionId = signal<number | null>(null);
  readonly selectedNoteId = signal<number | null>(null);

  // ── Loading flags ─────────────────────────────────────────────
  readonly loadingNotebooks = signal(false);
  readonly loadingSections = signal(false);
  readonly loadingNotes = signal(false);

  // ── Computed selections ───────────────────────────────────────
  readonly selectedNotebook = computed(() => {
    const id = this.selectedNotebookId();
    return id ? this.notebooks().find((n) => n.id === id) ?? null : null;
  });

  readonly selectedSection = computed(() => {
    const id = this.selectedSectionId();
    return id ? this.sections().find((s) => s.id === id) ?? null : null;
  });

  readonly selectedNote = computed(() => {
    const id = this.selectedNoteId();
    return id ? this.notes().find((n) => n.id === id) ?? null : null;
  });

  // ── Subscriptions (for race-condition cancellation) ───────────
  private sectionsSub?: Subscription;
  private notesSub?: Subscription;

  // ── Load ──────────────────────────────────────────────────────

  loadNotebooks(): void {
    this.loadingNotebooks.set(true);
    this.notebookSvc.getAll().subscribe({
      next: (list) => {
        this.notebooks.set(list);
        this.loadingNotebooks.set(false);
      },
      error: () => this.loadingNotebooks.set(false),
    });
  }

  private loadSections(notebookId: number): void {
    this.sectionsSub?.unsubscribe();
    this.loadingSections.set(true);
    this.sectionsSub = this.sectionSvc.getByNotebook(notebookId).subscribe({
      next: (list) => {
        this.sections.set(list);
        this.loadingSections.set(false);
      },
      error: () => this.loadingSections.set(false),
    });
  }

  private loadNotes(sectionId: number): void {
    this.notesSub?.unsubscribe();
    this.loadingNotes.set(true);
    this.notesSub = this.noteSvc.getBySection(sectionId).subscribe({
      next: (list) => {
        this.notes.set(list);
        this.loadingNotes.set(false);
      },
      error: () => this.loadingNotes.set(false),
    });
  }

  // ── Selection (cascading) ─────────────────────────────────────

  selectNotebook(id: number): void {
    if (this.selectedNotebookId() === id) return;
    this.selectedNotebookId.set(id);
    this.selectedSectionId.set(null);
    this.selectedNoteId.set(null);
    this.sections.set([]);
    this.notes.set([]);
    this.loadSections(id);
  }

  selectSection(id: number): void {
    if (this.selectedSectionId() === id) return;
    this.selectedSectionId.set(id);
    this.selectedNoteId.set(null);
    this.notes.set([]);
    this.loadNotes(id);
  }

  selectNote(id: number): void {
    this.selectedNoteId.set(id);
  }

  /** Select a note from search results — sets all IDs without cascading clear. */
  selectNoteFromSearch(notebookId: number, sectionId: number, noteId: number): void {
    this.selectedNotebookId.set(notebookId);
    this.selectedSectionId.set(sectionId);
    this.selectedNoteId.set(noteId);
    this.loadSections(notebookId);
    this.loadNotes(sectionId);
  }

  // ── Notebook CRUD ─────────────────────────────────────────────

  createNotebook(title: string): void {
    this.notebookSvc.create(title).subscribe((nb) => {
      this.notebooks.update((list) => [...list, nb]);
      this.selectNotebook(nb.id);
    });
  }

  renameNotebook(id: number, title: string): void {
    this.notebookSvc.update(id, { title }).subscribe((updated) => {
      this.notebooks.update((list) => list.map((n) => (n.id === id ? updated : n)));
    });
  }

  deleteNotebook(id: number): void {
    this.notebookSvc.delete(id).subscribe(() => {
      this.notebooks.update((list) => list.filter((n) => n.id !== id));
      if (this.selectedNotebookId() === id) {
        this.selectedNotebookId.set(null);
        this.selectedSectionId.set(null);
        this.selectedNoteId.set(null);
        this.sections.set([]);
        this.notes.set([]);
      }
    });
  }

  // ── Section CRUD ──────────────────────────────────────────────

  createSection(title: string): void {
    const nbId = this.selectedNotebookId();
    if (!nbId) return;
    this.sectionSvc.create(nbId, title).subscribe((sec) => {
      this.sections.update((list) => [...list, sec]);
      this.selectSection(sec.id);
    });
  }

  renameSection(id: number, title: string): void {
    this.sectionSvc.update(id, { title }).subscribe((updated) => {
      this.sections.update((list) => list.map((s) => (s.id === id ? updated : s)));
    });
  }

  moveSection(sectionId: number, targetNotebookId: number): void {
    this.sectionSvc.update(sectionId, { notebookId: targetNotebookId }).subscribe({
      next: () => {
        this.sections.update((list) => list.filter((s) => s.id !== sectionId));
        if (this.selectedSectionId() === sectionId) {
          this.selectedSectionId.set(null);
          this.selectedNoteId.set(null);
          this.notes.set([]);
        }
      },
      error: (err) => console.error('Failed to move section:', err),
    });
  }

  deleteSection(id: number): void {
    this.sectionSvc.delete(id).subscribe(() => {
      this.sections.update((list) => list.filter((s) => s.id !== id));
      if (this.selectedSectionId() === id) {
        this.selectedSectionId.set(null);
        this.selectedNoteId.set(null);
        this.notes.set([]);
      }
    });
  }

  // ── Note CRUD ─────────────────────────────────────────────────

  createNote(title: string, content?: string): void {
    const secId = this.selectedSectionId();
    if (!secId) return;
    this.noteSvc.create(secId, title, content).subscribe((note) => {
      this.notes.update((list) => [...list, note]);
      this.selectNote(note.id);
    });
  }

  updateNote(id: number, updates: { title?: string; content?: string }): void {
    this.noteSvc.update(id, updates).subscribe((updated) => {
      this.notes.update((list) => list.map((n) => (n.id === id ? updated : n)));
    });
  }

  duplicateNote(id: number): void {
    const note = this.notes().find((n) => n.id === id);
    if (!note) return;
    const secId = note.sectionId;
    const title = `Copy of ${note.title}`;
    this.noteSvc.create(secId, title, note.content).subscribe((copy) => {
      this.notes.update((list) => [...list, copy]);
      this.selectNote(copy.id);
    });
  }

  moveNote(noteId: number, targetSectionId: number): void {
    this.noteSvc.update(noteId, { sectionId: targetSectionId }).subscribe(() => {
      this.notes.update((list) => list.filter((n) => n.id !== noteId));
      if (this.selectedNoteId() === noteId) {
        this.selectedNoteId.set(null);
      }
    });
  }

  favoriteNote(id: number): void {
    this.noteSvc.favorite(id).subscribe({
      next: () => {
        const now = new Date().toISOString();
        this.notes.update((list) =>
          list.map((n) => (n.id === id ? { ...n, favoritedAt: now } : n))
        );
      },
      error: (err) => console.error('Failed to favorite note:', err),
    });
  }

  unfavoriteNote(id: number): void {
    this.noteSvc.unfavorite(id).subscribe({
      next: () => {
        this.notes.update((list) =>
          list.map((n) => (n.id === id ? { ...n, favoritedAt: null } : n))
        );
      },
      error: (err) => console.error('Failed to unfavorite note:', err),
    });
  }

  shareNote(id: number): void {
    this.noteSvc.share(id).subscribe({
      next: ({ shareToken }) => {
        this.notes.update((list) =>
          list.map((n) => (n.id === id ? { ...n, shareToken } : n))
        );
      },
      error: (err) => console.error('Failed to share note:', err),
    });
  }

  unshareNote(id: number): void {
    this.noteSvc.unshare(id).subscribe({
      next: () => {
        this.notes.update((list) =>
          list.map((n) => (n.id === id ? { ...n, shareToken: null } : n))
        );
      },
      error: (err) => console.error('Failed to unshare note:', err),
    });
  }

  archiveNote(id: number): void {
    this.noteSvc.archive(id).subscribe({
      next: () => {
        this.notes.update((list) => list.filter((n) => n.id !== id));
        if (this.selectedNoteId() === id) {
          this.selectedNoteId.set(null);
        }
      },
      error: (err) => console.error('Failed to archive note:', err),
    });
  }

  deleteNote(id: number): void {
    this.noteSvc.delete(id).subscribe(() => {
      this.notes.update((list) => list.filter((n) => n.id !== id));
      if (this.selectedNoteId() === id) {
        this.selectedNoteId.set(null);
      }
    });
  }

  // ── Reorder (drag-and-drop) ───────────────────────────────────

  reorderNotebooks(reordered: NotebookDto[]): void {
    this.notebooks.set(reordered);
    reordered.forEach((nb, i) => {
      if (nb.order !== i) {
        this.notebookSvc.update(nb.id, { order: i }).subscribe();
      }
    });
  }

  reorderSections(reordered: SectionDto[]): void {
    this.sections.set(reordered);
    reordered.forEach((sec, i) => {
      if (sec.order !== i) {
        this.sectionSvc.update(sec.id, { order: i }).subscribe();
      }
    });
  }

  reorderNotes(reordered: NoteDto[]): void {
    this.notes.set(reordered);
    reordered.forEach((note, i) => {
      if (note.order !== i) {
        this.noteSvc.update(note.id, { order: i }).subscribe();
      }
    });
  }
}
