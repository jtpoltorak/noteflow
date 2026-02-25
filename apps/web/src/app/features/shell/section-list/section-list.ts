import { Component, inject, signal, ElementRef, viewChild } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faLayerGroup, faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import type { SectionDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-section-list',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag],
  template: `
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
      <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sections</span>
      @if (state.selectedNotebookId()) {
        <button
          (click)="startCreating()"
          class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="New section"
        >
          <fa-icon [icon]="faPlus" size="sm" />
        </button>
      }
    </div>

    <div class="flex-1 overflow-y-auto p-1" cdkDropList (cdkDropListDropped)="onDrop($event)">
      @if (!state.selectedNotebookId()) {
        <p class="px-2 py-4 text-center text-sm text-gray-400">Select a notebook</p>
      } @else {
        @if (creating()) {
          <div class="px-2 py-1">
            <input
              #createInput
              type="text"
              placeholder="Section name"
              class="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
              (keydown.enter)="confirmCreate(createInput.value)"
              (keydown.escape)="creating.set(false)"
              (blur)="confirmCreate(createInput.value)"
            />
          </div>
        }

        @for (sec of state.sections(); track sec.id) {
          <div
            cdkDrag
            class="group flex items-center rounded px-2 py-1.5 text-sm cursor-pointer dark:text-gray-200"
            [class.bg-blue-100]="sec.id === state.selectedSectionId()"
            [class.dark:bg-blue-900]="sec.id === state.selectedSectionId()"
            [class.hover:bg-gray-100]="sec.id !== state.selectedSectionId()"
            [class.dark:hover:bg-gray-700]="sec.id !== state.selectedSectionId()"
            (click)="onItemClick(sec.id)"
          >
            <fa-icon [icon]="faLayerGroup" class="mr-2 text-gray-400" size="sm" />

            @if (editingId() === sec.id) {
              <input
                #renameInput
                type="text"
                [value]="sec.title"
                class="min-w-0 flex-1 rounded border border-blue-300 px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-100"
                (keydown.enter)="confirmRename(sec.id, renameInput.value)"
                (keydown.escape)="editingId.set(null)"
                (blur)="confirmRename(sec.id, renameInput.value)"
                (click)="$event.stopPropagation()"
              />
            } @else {
              <span class="min-w-0 flex-1 truncate">{{ sec.title }}</span>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100">
                <button
                  (click)="startRenaming(sec.id, $event)"
                  class="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Rename"
                >
                  <fa-icon [icon]="faPen" size="xs" />
                </button>
                <button
                  (click)="startDeleting(sec.id, $event)"
                  class="rounded p-0.5 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <fa-icon [icon]="faTrash" size="xs" />
                </button>
              </div>
            }
          </div>

          @if (deletingId() === sec.id) {
            <app-confirm-dialog
              [message]="'Delete ' + sec.title + ' and all its notes?'"
              (confirmed)="confirmDelete(sec.id)"
              (cancelled)="deletingId.set(null)"
            ></app-confirm-dialog>
          }
        } @empty {
          @if (!creating()) {
            <p class="px-2 py-4 text-center text-sm text-gray-400">
              No sections yet. Click + to create one.
            </p>
          }
        }
      }
    </div>
  `,
})
export class SectionList {
  protected state = inject(ShellStateService);

  protected faLayerGroup = faLayerGroup;
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
    setTimeout(() => this.createInputRef()?.nativeElement.focus());
  }

  protected confirmCreate(title: string): void {
    if (!this.creating()) return;
    this.creating.set(false);
    const trimmed = title.trim();
    if (trimmed) {
      this.state.createSection(trimmed);
    }
  }

  protected startRenaming(id: number, event: Event): void {
    event.stopPropagation();
    this.editingId.set(id);
  }

  protected confirmRename(id: number, title: string): void {
    if (this.editingId() !== id) return;
    this.editingId.set(null);
    const trimmed = title.trim();
    if (trimmed) {
      this.state.renameSection(id, trimmed);
    }
  }

  protected startDeleting(id: number, event: Event): void {
    event.stopPropagation();
    this.deletingId.set(id);
  }

  protected confirmDelete(id: number): void {
    this.deletingId.set(null);
    this.state.deleteSection(id);
  }

  protected onDrop(event: CdkDragDrop<SectionDto[]>): void {
    this.dragged = true;
    if (event.previousIndex === event.currentIndex) return;
    const list = [...this.state.sections()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.state.reorderSections(list);
  }

  protected onItemClick(id: number): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    this.state.selectSection(id);
  }
}
