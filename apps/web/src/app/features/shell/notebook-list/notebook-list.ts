import { Component, inject, signal, ElementRef, viewChild } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBook, faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import type { NotebookDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-notebook-list',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag],
  template: `
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Notebooks</span>
      <button
        (click)="startCreating()"
        class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        title="New notebook"
      >
        <fa-icon [icon]="faPlus" size="sm" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-1" cdkDropList (cdkDropListDropped)="onDrop($event)">
      @if (creating()) {
        <div class="px-2 py-1">
          <input
            #createInput
            type="text"
            placeholder="Notebook name"
            class="w-full rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            (keydown.enter)="confirmCreate(createInput.value)"
            (keydown.escape)="creating.set(false)"
            (blur)="confirmCreate(createInput.value)"
          />
        </div>
      }

      @for (nb of state.notebooks(); track nb.id) {
        <div
          cdkDrag
          class="group flex items-center rounded px-2 py-1.5 text-sm cursor-pointer"
          [class.bg-blue-100]="nb.id === state.selectedNotebookId()"
          [class.hover:bg-gray-100]="nb.id !== state.selectedNotebookId()"
          (click)="onItemClick(nb.id)"
        >
          <fa-icon [icon]="faBook" class="mr-2 text-gray-400" size="sm" />

          @if (editingId() === nb.id) {
            <input
              #renameInput
              type="text"
              [value]="nb.title"
              class="min-w-0 flex-1 rounded border border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              (keydown.enter)="confirmRename(nb.id, renameInput.value)"
              (keydown.escape)="editingId.set(null)"
              (blur)="confirmRename(nb.id, renameInput.value)"
              (click)="$event.stopPropagation()"
            />
          } @else {
            <span class="min-w-0 flex-1 truncate">{{ nb.title }}</span>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100">
              <button
                (click)="startRenaming(nb.id, $event)"
                class="rounded p-0.5 text-gray-400 hover:text-gray-600"
                title="Rename"
              >
                <fa-icon [icon]="faPen" size="xs" />
              </button>
              <button
                (click)="startDeleting(nb.id, $event)"
                class="rounded p-0.5 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <fa-icon [icon]="faTrash" size="xs" />
              </button>
            </div>
          }
        </div>

        @if (deletingId() === nb.id) {
          <app-confirm-dialog
            [message]="'Delete ' + nb.title + ' and all its sections?'"
            (confirmed)="confirmDelete(nb.id)"
            (cancelled)="deletingId.set(null)"
          ></app-confirm-dialog>
        }
      } @empty {
        @if (!creating()) {
          <p class="px-2 py-4 text-center text-sm text-gray-400">
            No notebooks yet. Click + to create one.
          </p>
        }
      }
    </div>
  `,
})
export class NotebookList {
  protected state = inject(ShellStateService);

  protected faBook = faBook;
  protected faPlus = faPlus;
  protected faPen = faPen;
  protected faTrash = faTrash;

  protected creating = signal(false);
  protected editingId = signal<number | null>(null);
  protected deletingId = signal<number | null>(null);
  private dragged = false;

  private createInputRef = viewChild<ElementRef<HTMLInputElement>>('createInput');

  protected startCreating(): void {
    this.creating.set(true);
    // Focus after the input renders
    setTimeout(() => this.createInputRef()?.nativeElement.focus());
  }

  protected confirmCreate(title: string): void {
    if (!this.creating()) return;
    this.creating.set(false);
    const trimmed = title.trim();
    if (trimmed) {
      this.state.createNotebook(trimmed);
    }
  }

  protected startRenaming(id: number, event: Event): void {
    event.stopPropagation();
    this.editingId.set(id);
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('#renameInput');
      el?.focus();
      el?.select();
    });
  }

  protected confirmRename(id: number, title: string): void {
    if (this.editingId() !== id) return;
    this.editingId.set(null);
    const trimmed = title.trim();
    if (trimmed) {
      this.state.renameNotebook(id, trimmed);
    }
  }

  protected startDeleting(id: number, event: Event): void {
    event.stopPropagation();
    this.deletingId.set(id);
  }

  protected confirmDelete(id: number): void {
    this.deletingId.set(null);
    this.state.deleteNotebook(id);
  }

  protected onDrop(event: CdkDragDrop<NotebookDto[]>): void {
    this.dragged = true;
    if (event.previousIndex === event.currentIndex) return;
    const list = [...this.state.notebooks()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.state.reorderNotebooks(list);
  }

  protected onItemClick(id: number): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    this.state.selectNotebook(id);
  }
}
