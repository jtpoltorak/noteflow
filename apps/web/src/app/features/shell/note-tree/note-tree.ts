import { Component, ElementRef, inject, signal, computed, viewChild, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBook, faLayerGroup, faStickyNote, faPlus, faMinus, faPen, faTrash, faChevronLeft, faSpinner, faLock, faAnglesDown, faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { TreeStateService } from './tree-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import type { TreeNode } from './tree-node.model';

interface DropIndicator {
  nodeType: string;
  nodeId: number;
  position: 'before' | 'after' | 'inside';
}

@Component({
  selector: 'app-note-tree',
  imports: [FaIconComponent, ConfirmDialog],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
      <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</span>
      <div class="flex items-center gap-1">
        <button
          (click)="collapse.emit()"
          class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Collapse panel"
        >
          <fa-icon [icon]="faChevronLeft" size="xs" />
        </button>
        <button
          (click)="toggleExpandAll()"
          class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          [title]="isAnyExpanded() ? 'Collapse all' : 'Expand all'"
        >
          <fa-icon [icon]="isAnyExpanded() ? faAnglesUp : faAnglesDown" size="sm" />
        </button>
        <button
          (click)="startCreatingNotebook()"
          class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="New notebook"
        >
          <fa-icon [icon]="faPlus" size="sm" />
        </button>
      </div>
    </div>

    <div
      class="flex-1 overflow-y-auto p-1"
      role="tree"
      (dragleave)="onTreeDragLeave($event)"
    >
      <!-- New notebook inline input -->
      @if (creatingNotebook()) {
        <div class="px-2 py-1">
          <input
            #notebookCreateInput
            type="text"
            placeholder="Notebook name"
            maxlength="50"
            class="w-full rounded border border-accent-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-accent-600 dark:bg-gray-700 dark:text-gray-100"
            (keydown.enter)="confirmCreateNotebook(notebookCreateInput.value)"
            (keydown.escape)="creatingNotebook.set(false)"
            (blur)="confirmCreateNotebook(notebookCreateInput.value)"
          />
        </div>
      }

      @for (node of tree.flatNodes(); track trackNode(node)) {
        <div
          role="treeitem"
          [attr.aria-expanded]="node.expandable ? isExpanded(node) : null"
          [attr.aria-level]="node.level + 1"
          [attr.data-level]="node.level"
          [attr.data-last-child]="node.isLastChild"
          [attr.draggable]="isEditing(node) ? 'false' : 'true'"
          class="tree-node group relative flex items-center rounded py-1 pr-1 text-sm cursor-pointer dark:text-gray-200"
          [style.padding-left.px]="node.level * 20 + 4 + (node.type === 'note' ? 4 : 0)"
          [class.bg-accent-100]="isSelected(node) && !isDropTarget(node, 'inside')"
          [class.dark:bg-accent-900/40]="isSelected(node) && !isDropTarget(node, 'inside')"
          [class.hover:bg-gray-100]="!isSelected(node) && !isDropTarget(node, 'inside')"
          [class.dark:hover:bg-gray-700]="!isSelected(node) && !isDropTarget(node, 'inside')"
          [class.opacity-40]="isDraggedNode(node)"
          [class.bg-accent-50]="isDropTarget(node, 'inside')"
          [class.dark:bg-accent-900/30]="isDropTarget(node, 'inside')"
          (click)="onNodeClick(node, $event)"
          (dragstart)="onDragStart(node, $event)"
          (dragover)="onDragOver(node, $event)"
          (drop)="onNodeDrop(node, $event)"
          (dragend)="onDragEnd()"
        >
          <!-- Drop indicator line (before) -->
          @if (isDropTarget(node, 'before')) {
            <span class="absolute left-1 right-1 top-0 h-0.5 rounded bg-accent-500"></span>
          }
          <!-- Drop indicator line (after) -->
          @if (isDropTarget(node, 'after')) {
            <span class="absolute bottom-0 left-1 right-1 h-0.5 rounded bg-accent-500"></span>
          }

          <!-- Pass-through connector line for level-2 nodes when parent section isn't last -->
          @if (node.level === 2 && !node.parentIsLastChild) {
            <span class="tree-passthrough-line" style="left: 14px"></span>
          }

          <!-- Expand/collapse toggle -->
          @if (node.expandable) {
            <button
              (click)="onToggle(node, $event)"
              class="mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
            >
              @if (isLoading(node)) {
                <fa-icon [icon]="faSpinner" size="xs" class="animate-spin" />
              } @else {
                <fa-icon [icon]="isExpanded(node) ? faMinus : faPlus" size="2xs" />
              }
            </button>
          } @else if (node.type !== 'note') {
            <span class="mr-0.5 h-5 w-5 shrink-0"></span>
          }

          <!-- Type icon -->
          <fa-icon
            [icon]="node.type === 'notebook' ? faBook : node.type === 'section' ? faLayerGroup : faStickyNote"
            class="mr-1.5 shrink-0 text-gray-400"
            size="sm"
          />

          <!-- Title or inline edit -->
          @if (isEditing(node)) {
            <input
              #renameInput
              type="text"
              [value]="node.title"
              maxlength="75"
              class="min-w-0 flex-1 rounded border border-accent-300 px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-accent-600 dark:bg-gray-700 dark:text-gray-100"
              (keydown.enter)="confirmRename(node, renameInput.value)"
              (keydown.escape)="tree.editingNode.set(null)"
              (blur)="confirmRename(node, renameInput.value)"
              (click)="$event.stopPropagation()"
            />
          } @else {
            <span class="min-w-0 flex-1 truncate" [title]="node.title">{{ node.title || 'Untitled' }}</span>
            @if (node.isLocked) {
              <fa-icon [icon]="faLock" class="ml-1 shrink-0 text-gray-400" size="xs" />
            }
            <!-- Hover actions (hidden while dragging) -->
            <div class="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100" [class.hidden]="draggedNode()">
              @if (node.type !== 'note') {
                <button
                  (click)="startCreatingChild(node, $event)"
                  class="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  [title]="node.type === 'notebook' ? 'New section' : 'New note'"
                >
                  <fa-icon [icon]="faPlus" size="xs" />
                </button>
              }
              <button
                (click)="startRenaming(node, $event)"
                class="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Rename"
              >
                <fa-icon [icon]="faPen" size="xs" />
              </button>
              <button
                (click)="startDeleting(node, $event)"
                class="rounded p-0.5 text-gray-400 hover:text-red-600"
                [title]="skipRecycleBin() ? 'Delete permanently' : 'Move to Recycle Bin'"
              >
                <fa-icon [icon]="faTrash" size="xs" />
              </button>
            </div>
          }
        </div>

        <!-- Inline create child input (shows after this node) -->
        @if (isCreatingChildOf(node)) {
          <div class="py-0.5" [style.padding-left.px]="(node.level + 1) * 20 + 4">
            <input
              #childCreateInput
              type="text"
              [placeholder]="node.type === 'notebook' ? 'Section name' : 'Note title'"
              maxlength="75"
              class="w-full rounded border border-accent-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-accent-600 dark:bg-gray-700 dark:text-gray-100"
              (keydown.enter)="confirmCreateChild(node, childCreateInput.value)"
              (keydown.escape)="tree.creatingUnder.set(null)"
              (blur)="confirmCreateChild(node, childCreateInput.value)"
            />
          </div>
        }

        <!-- Delete confirmation -->
        @if (deletingNode()?.type === node.type && deletingNode()?.id === node.id) {
          <div [style.padding-left.px]="node.level * 20 + 4">
            <app-confirm-dialog
              [message]="getDeleteMessage(node)"
              [confirmLabel]="skipRecycleBin() ? 'Delete permanently' : 'Move to Recycle Bin'"
              (confirmed)="confirmDelete(node)"
              (cancelled)="deletingNode.set(null)"
            />
          </div>
        }
      } @empty {
        @if (!creatingNotebook()) {
          <p class="px-2 py-4 text-center text-sm text-gray-400">
            No notebooks yet. Click + to create one.
          </p>
        }
      }
    </div>
  `,
})
export class NoteTree {
  protected state = inject(ShellStateService);
  protected tree = inject(TreeStateService);
  private auth = inject(AuthService);

  collapse = output();

  protected skipRecycleBin = computed(() => this.auth.user()?.skipRecycleBin ?? false);

  protected faBook = faBook;
  protected faLayerGroup = faLayerGroup;
  protected faStickyNote = faStickyNote;
  protected faPlus = faPlus;
  protected faMinus = faMinus;
  protected faAnglesDown = faAnglesDown;
  protected faAnglesUp = faAnglesUp;

  protected isAnyExpanded = computed(() => this.tree.expandedNotebooks().size > 0);
  protected faPen = faPen;
  protected faTrash = faTrash;
  protected faChevronLeft = faChevronLeft;
  protected faSpinner = faSpinner;
  protected faLock = faLock;

  protected creatingNotebook = signal(false);
  protected deletingNode = signal<{ type: string; id: number } | null>(null);

  // ── Drag-and-drop state ─────────────────────────────────────
  protected draggedNode = signal<TreeNode | null>(null);
  protected dropIndicator = signal<DropIndicator | null>(null);
  private dragExpandTimer: ReturnType<typeof setTimeout> | null = null;

  private notebookCreateInputRef = viewChild<ElementRef<HTMLInputElement>>('notebookCreateInput');
  private childCreateInputRef = viewChild<ElementRef<HTMLInputElement>>('childCreateInput');

  // ── Helpers for template ────────────────────────────────────

  protected trackNode(node: TreeNode): string {
    return `${node.type}-${node.id}`;
  }

  protected isExpanded(node: TreeNode): boolean {
    if (node.type === 'notebook') return this.tree.expandedNotebooks().has(node.id);
    if (node.type === 'section') return this.tree.expandedSections().has(node.id);
    return false;
  }

  protected isLoading(node: TreeNode): boolean {
    return this.tree.loadingIds().has(`${node.type === 'notebook' ? 'notebook' : 'section'}-${node.id}`);
  }

  protected isSelected(node: TreeNode): boolean {
    if (node.type === 'notebook') return node.id === this.state.selectedNotebookId() && !this.state.selectedSectionId();
    if (node.type === 'section') return node.id === this.state.selectedSectionId() && !this.state.selectedNoteId();
    return node.id === this.state.selectedNoteId();
  }

  protected isEditing(node: TreeNode): boolean {
    const e = this.tree.editingNode();
    return e?.type === node.type && e?.id === node.id;
  }

  protected isCreatingChildOf(node: TreeNode): boolean {
    const c = this.tree.creatingUnder();
    return c?.type === node.type && c?.id === node.id;
  }

  protected isDraggedNode(node: TreeNode): boolean {
    const d = this.draggedNode();
    return d?.type === node.type && d?.id === node.id;
  }

  protected isDropTarget(node: TreeNode, position: 'before' | 'after' | 'inside'): boolean {
    const t = this.dropIndicator();
    return t?.nodeType === node.type && t?.nodeId === node.id && t?.position === position;
  }

  // ── Node interactions ───────────────────────────────────────

  protected toggleExpandAll(): void {
    if (this.isAnyExpanded()) {
      this.tree.collapseAll();
    } else {
      this.tree.expandAll();
    }
  }

  protected onNodeClick(node: TreeNode, event: Event): void {
    this.tree.selectNode(node);
  }

  protected onToggle(node: TreeNode, event: Event): void {
    event.stopPropagation();
    if (node.type === 'notebook') {
      this.tree.toggleNotebook(node.id);
    } else if (node.type === 'section') {
      this.tree.toggleSection(node.id);
    }
  }

  // ── Drag-and-drop ──────────────────────────────────────────

  protected onDragStart(node: TreeNode, event: DragEvent): void {
    if (this.isEditing(node)) {
      event.preventDefault();
      return;
    }
    this.draggedNode.set(node);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', '');
    }
  }

  protected onDragOver(node: TreeNode, event: DragEvent): void {
    const dragged = this.draggedNode();
    if (!dragged) return;
    if (dragged.type === node.type && dragged.id === node.id) {
      this.dropIndicator.set(null);
      return;
    }

    const position = this.calculateDropPosition(dragged, node, event);
    if (!position) {
      this.dropIndicator.set(null);
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropIndicator.set({ nodeType: node.type, nodeId: node.id, position });

    // Auto-expand collapsed parents when hovering with 'inside' position
    if (position === 'inside' && node.expandable && !this.isExpanded(node)) {
      if (!this.dragExpandTimer) {
        this.dragExpandTimer = setTimeout(() => {
          if (node.type === 'notebook') this.tree.toggleNotebook(node.id);
          else if (node.type === 'section') this.tree.toggleSection(node.id);
          this.dragExpandTimer = null;
        }, 600);
      }
    } else {
      this.clearDragExpandTimer();
    }
  }

  protected onTreeDragLeave(event: DragEvent): void {
    const container = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement | null;
    if (!related || !container.contains(related)) {
      this.dropIndicator.set(null);
      this.clearDragExpandTimer();
    }
  }

  protected onNodeDrop(node: TreeNode, event: DragEvent): void {
    event.preventDefault();
    const dragged = this.draggedNode();
    const indicator = this.dropIndicator();
    this.draggedNode.set(null);
    this.dropIndicator.set(null);
    this.clearDragExpandTimer();

    if (!dragged || !indicator) return;
    if (indicator.nodeType !== node.type || indicator.nodeId !== node.id) return;

    this.executeDrop(dragged, node, indicator.position);
  }

  protected onDragEnd(): void {
    this.draggedNode.set(null);
    this.dropIndicator.set(null);
    this.clearDragExpandTimer();
  }

  private calculateDropPosition(
    dragged: TreeNode,
    target: TreeNode,
    event: DragEvent,
  ): 'before' | 'after' | 'inside' | null {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;

    if (dragged.type === 'notebook') {
      // Notebooks can only reorder among other notebooks
      if (target.type !== 'notebook') return null;
      return y < height / 2 ? 'before' : 'after';
    }

    if (dragged.type === 'section') {
      if (target.type === 'notebook') return 'inside';
      if (target.type === 'section') return y < height / 2 ? 'before' : 'after';
      return null; // Can't drop section on a note
    }

    if (dragged.type === 'note') {
      if (target.type === 'section') return 'inside';
      if (target.type === 'note') return y < height / 2 ? 'before' : 'after';
      return null; // Can't drop note on a notebook
    }

    return null;
  }

  private executeDrop(dragged: TreeNode, target: TreeNode, position: 'before' | 'after' | 'inside'): void {
    if (dragged.type === 'notebook' && target.type === 'notebook') {
      this.dropNotebook(dragged, target, position as 'before' | 'after');
    } else if (dragged.type === 'section') {
      if (position === 'inside' && target.type === 'notebook') {
        this.dropSectionIntoNotebook(dragged, target.id);
      } else if (target.type === 'section') {
        this.dropSectionNearSection(dragged, target, position as 'before' | 'after');
      }
    } else if (dragged.type === 'note') {
      if (position === 'inside' && target.type === 'section') {
        this.dropNoteIntoSection(dragged, target.id);
      } else if (target.type === 'note') {
        this.dropNoteNearNote(dragged, target, position as 'before' | 'after');
      }
    }
  }

  private dropNotebook(dragged: TreeNode, target: TreeNode, position: 'before' | 'after'): void {
    const notebooks = [...this.state.notebooks()];
    const fromIndex = notebooks.findIndex((nb) => nb.id === dragged.id);
    let toIndex = notebooks.findIndex((nb) => nb.id === target.id);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const [item] = notebooks.splice(fromIndex, 1);
    if (fromIndex < toIndex) toIndex--;
    if (position === 'after') toIndex++;
    notebooks.splice(toIndex, 0, item);

    this.state.reorderNotebooks(notebooks);
  }

  private dropSectionNearSection(dragged: TreeNode, target: TreeNode, position: 'before' | 'after'): void {
    const fromNbId = dragged.parentId!;
    const toNbId = target.parentId!;

    if (fromNbId === toNbId) {
      // Same notebook — reorder
      const sections = [...(this.tree.sectionCache().get(fromNbId) ?? [])];
      const fromIndex = sections.findIndex((s) => s.id === dragged.id);
      let toIndex = sections.findIndex((s) => s.id === target.id);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      const [item] = sections.splice(fromIndex, 1);
      if (fromIndex < toIndex) toIndex--;
      if (position === 'after') toIndex++;
      sections.splice(toIndex, 0, item);

      this.tree.reorderSectionsInNotebook(fromNbId, sections);
    } else {
      // Different notebook — move
      const targetSections = [...(this.tree.sectionCache().get(toNbId) ?? [])];
      let toIndex = targetSections.findIndex((s) => s.id === target.id);
      if (position === 'after') toIndex++;

      this.tree.moveSectionToNotebook(dragged.id, fromNbId, toNbId, toIndex);
    }
  }

  private dropSectionIntoNotebook(dragged: TreeNode, notebookId: number): void {
    const fromNbId = dragged.parentId!;
    if (fromNbId === notebookId) return; // Already in this notebook

    const toSections = this.tree.sectionCache().get(notebookId) ?? [];
    this.tree.moveSectionToNotebook(dragged.id, fromNbId, notebookId, toSections.length);
  }

  private dropNoteNearNote(dragged: TreeNode, target: TreeNode, position: 'before' | 'after'): void {
    const fromSecId = dragged.parentId!;
    const toSecId = target.parentId!;

    if (fromSecId === toSecId) {
      // Same section — reorder
      const notes = [...(this.tree.noteCache().get(fromSecId) ?? [])];
      const fromIndex = notes.findIndex((n) => n.id === dragged.id);
      let toIndex = notes.findIndex((n) => n.id === target.id);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      const [item] = notes.splice(fromIndex, 1);
      if (fromIndex < toIndex) toIndex--;
      if (position === 'after') toIndex++;
      notes.splice(toIndex, 0, item);

      this.tree.reorderNotesInSection(fromSecId, notes);
    } else {
      // Different section — move
      const targetNotes = [...(this.tree.noteCache().get(toSecId) ?? [])];
      let toIndex = targetNotes.findIndex((n) => n.id === target.id);
      if (position === 'after') toIndex++;

      this.tree.moveNoteToSection(dragged.id, fromSecId, toSecId, toIndex);
    }
  }

  private dropNoteIntoSection(dragged: TreeNode, sectionId: number): void {
    const fromSecId = dragged.parentId!;
    if (fromSecId === sectionId) return; // Already in this section

    const toNotes = this.tree.noteCache().get(sectionId) ?? [];
    this.tree.moveNoteToSection(dragged.id, fromSecId, sectionId, toNotes.length);
  }

  private clearDragExpandTimer(): void {
    if (this.dragExpandTimer) {
      clearTimeout(this.dragExpandTimer);
      this.dragExpandTimer = null;
    }
  }

  // ── Create notebook ─────────────────────────────────────────

  protected startCreatingNotebook(): void {
    this.creatingNotebook.set(true);
    setTimeout(() => this.notebookCreateInputRef()?.nativeElement.focus());
  }

  protected confirmCreateNotebook(title: string): void {
    if (!this.creatingNotebook()) return;
    this.creatingNotebook.set(false);
    const trimmed = title.trim();
    if (trimmed) {
      this.state.createNotebook(trimmed);
    }
  }

  // ── Create child (section under notebook, note under section) ──

  protected startCreatingChild(node: TreeNode, event: Event): void {
    event.stopPropagation();
    // Auto-expand the parent
    if (node.type === 'notebook' && !this.tree.expandedNotebooks().has(node.id)) {
      this.tree.toggleNotebook(node.id);
    }
    if (node.type === 'section' && !this.tree.expandedSections().has(node.id)) {
      this.tree.toggleSection(node.id);
    }
    this.tree.creatingUnder.set({ type: node.type as 'notebook' | 'section', id: node.id });
    setTimeout(() => this.childCreateInputRef()?.nativeElement.focus());
  }

  protected confirmCreateChild(parentNode: TreeNode, title: string): void {
    const c = this.tree.creatingUnder();
    if (!c || c.type !== parentNode.type || c.id !== parentNode.id) return;
    this.tree.creatingUnder.set(null);
    const trimmed = title.trim();
    if (!trimmed) return;

    if (parentNode.type === 'notebook') {
      // Select notebook first so createSection works
      this.state.selectedNotebookId.set(parentNode.id);
      this.state.createSection(trimmed);
      // Invalidate cache after a short delay for the API call to complete
      setTimeout(() => this.tree.invalidateNotebookCache(parentNode.id), 500);
    } else if (parentNode.type === 'section') {
      // Find the notebook for this section
      const nbId = this.findNotebookForSection(parentNode.id);
      if (nbId !== null) {
        this.state.selectedNotebookId.set(nbId);
      }
      this.state.selectedSectionId.set(parentNode.id);
      this.state.createNote(trimmed);
      setTimeout(() => this.tree.invalidateSectionCache(parentNode.id), 500);
    }
  }

  // ── Rename ──────────────────────────────────────────────────

  protected startRenaming(node: TreeNode, event: Event): void {
    event.stopPropagation();
    this.tree.editingNode.set({ type: node.type, id: node.id });
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[class*="border-accent-300"]');
      input?.focus();
      input?.select();
    });
  }

  protected confirmRename(node: TreeNode, title: string): void {
    const e = this.tree.editingNode();
    if (!e || e.type !== node.type || e.id !== node.id) return;
    this.tree.editingNode.set(null);
    const trimmed = title.trim();
    if (!trimmed || trimmed === node.title) return;

    if (node.type === 'notebook') {
      this.state.renameNotebook(node.id, trimmed);
    } else if (node.type === 'section') {
      this.state.renameSection(node.id, trimmed);
    } else {
      this.state.updateNote(node.id, { title: trimmed });
    }
  }

  // ── Delete ──────────────────────────────────────────────────

  protected startDeleting(node: TreeNode, event: Event): void {
    event.stopPropagation();
    this.deletingNode.set({ type: node.type, id: node.id });
  }

  protected getDeleteMessage(node: TreeNode): string {
    const perm = this.skipRecycleBin();
    if (node.type === 'notebook') {
      return perm
        ? `Permanently delete "${node.title}" and all its sections? This cannot be undone.`
        : `Move "${node.title}" and all its sections to the Recycle Bin?`;
    }
    if (node.type === 'section') {
      return perm
        ? `Permanently delete "${node.title}" and all its notes? This cannot be undone.`
        : `Move "${node.title}" and all its notes to the Recycle Bin?`;
    }
    return perm
      ? `Permanently delete "${node.title}"? This cannot be undone.`
      : `Move "${node.title}" to the Recycle Bin?`;
  }

  protected confirmDelete(node: TreeNode): void {
    this.deletingNode.set(null);
    if (node.type === 'notebook') {
      this.state.deleteNotebook(node.id);
    } else if (node.type === 'section') {
      // Select the notebook first so the section delete works correctly
      if (node.parentId) {
        this.state.selectedNotebookId.set(node.parentId);
      }
      this.state.deleteSection(node.id);
      if (node.parentId) {
        setTimeout(() => this.tree.invalidateNotebookCache(node.parentId!), 500);
      }
    } else {
      // Note delete
      const secId = node.parentId;
      if (secId) {
        const nbId = this.findNotebookForSection(secId);
        if (nbId !== null) this.state.selectedNotebookId.set(nbId);
        this.state.selectedSectionId.set(secId);
      }
      this.state.deleteNote(node.id);
      if (secId) {
        setTimeout(() => this.tree.invalidateSectionCache(secId), 500);
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private findNotebookForSection(sectionId: number): number | null {
    for (const [nbId, sections] of this.tree.sectionCache()) {
      if (sections.some((s) => s.id === sectionId)) {
        return nbId;
      }
    }
    return null;
  }
}
