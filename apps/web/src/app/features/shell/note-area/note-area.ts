import { Component, ElementRef, inject, signal, effect, input, output, viewChild, computed } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faPlus, faTrash, faChevronLeft, faChevronRight, faExpand, faCompress, faDesktop, faCopy, faArrowRightArrowLeft, faDownload, faFileImport, faBoxArchive, faStar, faBars, faShareNodes, faTag, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { TiptapEditor } from './tiptap-editor/tiptap-editor';
import { PresentationView } from './presentation-view';
import { MoveNoteDialog } from './move-note-dialog';
import { exportNoteAsMarkdown } from '../../../core/utils/export-markdown';
import { parseMarkdownFile } from '../../../core/utils/import-markdown';
import { TagService } from '../../../core/services/tag.service';
import type { NoteDto, TagDto, TagWithCountDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-note-area',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag, TiptapEditor, PresentationView, MoveNoteDialog],
  host: { class: 'flex min-h-0 min-w-0 flex-1 flex-col' },
  template: `
    <!-- ── Mobile: notes list only ─────────────────────────── -->
    @if (mobileMode() && !showEditorOnly()) {
      <div class="flex flex-1 flex-col overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</span>
          <div class="flex items-center gap-1">
            <button
              (click)="importNote()"
              class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Import Markdown"
            >
              <fa-icon [icon]="faFileImport" size="sm" />
            </button>
            <button
              (click)="createNote()"
              class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="New note"
            >
              <fa-icon [icon]="faPlus" size="sm" />
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-1">
          @if (!state.selectedSectionId()) {
            <p class="px-2 py-4 text-center text-sm text-gray-400">Select a section to see notes</p>
          } @else {
            @for (note of state.notes(); track note.id) {
              <div
                class="cursor-pointer rounded px-2 py-1.5 text-sm dark:text-gray-200"
                [class.bg-blue-100]="note.id === state.selectedNoteId()"
                [class.dark:bg-blue-900]="note.id === state.selectedNoteId()"
                [class.hover:bg-gray-100]="note.id !== state.selectedNoteId()"
                [class.dark:hover:bg-gray-700]="note.id !== state.selectedNoteId()"
                (click)="onItemClick(note.id)"
              >
                <div class="flex items-center">
                  <fa-icon [icon]="faStickyNote" class="mr-2 text-gray-400" size="sm" />
                  <span class="truncate" [title]="note.title">{{ note.title || 'Untitled' }}</span>
                </div>
              </div>
            } @empty {
              <p class="px-2 py-4 text-center text-sm text-gray-400">
                No notes yet. Click + to create one.
              </p>
            }
          }
        </div>
      </div>
    }

    <!-- ── Mobile: editor only ─────────────────────────────── -->
    @if (mobileMode() && showEditorOnly()) {
      <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
        @if (state.selectedNote()) {
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <input
              type="text"
              [value]="editedTitle()"
              maxlength="75"
              (input)="editedTitle.set($any($event.target).value)"
              (blur)="saveNote()"
              class="min-w-0 flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
              placeholder="Note title"
            />
            <button
              (mousedown)="$event.preventDefault()"
              (click)="toggleEditorToolbar()"
              class="ml-2 shrink-0 rounded p-1"
              [class]="isEditorToolbarVisible() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
              title="Toggle formatting toolbar"
            >
              <fa-icon [icon]="faBars" size="sm" />
            </button>
            <button
              (click)="toggleFavorite()"
              class="ml-1 shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              [class]="state.selectedNote()?.favoritedAt ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
              [title]="state.selectedNote()?.favoritedAt ? 'Remove from favorites' : 'Add to favorites'"
            >
              <fa-icon [icon]="state.selectedNote()?.favoritedAt ? faStar : farStar" size="sm" />
            </button>
            <button
              (click)="sharing.set(!sharing())"
              class="ml-1 shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              [class]="state.selectedNote()?.shareToken ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
              title="Share note"
            >
              <fa-icon [icon]="faShareNodes" size="sm" />
            </button>
            <button
              (click)="toggleTagging()"
              class="ml-1 shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              [class]="noteTags().length > 0 ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
              title="Tags"
            >
              <fa-icon [icon]="faTag" size="sm" />
            </button>
            <button
              (click)="moving.set(true)"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Move note"
            >
              <fa-icon [icon]="faArrowRightArrowLeft" size="sm" />
            </button>
            <button
              (click)="copyNote()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Duplicate note"
            >
              <fa-icon [icon]="faCopy" size="sm" />
            </button>
            <button
              (click)="exportNote()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Export as Markdown"
            >
              <fa-icon [icon]="faDownload" size="sm" />
            </button>
            <button
              (click)="startArchiving()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Archive note"
            >
              <fa-icon [icon]="faBoxArchive" size="sm" />
            </button>
            <button
              (click)="startDeleting()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:text-red-600"
              title="Delete note"
            >
              <fa-icon [icon]="faTrash" size="sm" />
            </button>
          </div>

          @if (tagging()) {
            <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
              <!-- Current tags -->
              @if (noteTags().length > 0) {
                <div class="mb-2 flex flex-wrap gap-1.5">
                  @for (tag of noteTags(); track tag.id) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {{ tag.name }}
                      <button
                        (click)="removeTag(tag)"
                        class="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                        title="Remove tag"
                      >
                        <fa-icon [icon]="faXmark" size="xs" />
                      </button>
                    </span>
                  }
                </div>
              }
              <!-- Add tag input -->
              <div class="relative">
                <input
                  type="text"
                  [value]="tagInput()"
                  (input)="tagInput.set($any($event.target).value)"
                  (keydown.enter)="addTag()"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                  placeholder="Add a tag…"
                  maxlength="30"
                />
                @if (filteredSuggestions().length > 0 && tagInput().length > 0) {
                  <ul class="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                    @for (suggestion of filteredSuggestions(); track suggestion.id) {
                      <li
                        (click)="addTagByName(suggestion.name)"
                        class="cursor-pointer px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        {{ suggestion.name }}
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          }

          @if (sharing()) {
            <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
              @if (state.selectedNote()?.shareToken) {
                <div class="flex flex-col gap-2">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">This note is shared publicly</p>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      readonly
                      [value]="getShareUrl()"
                      class="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    />
                    <button
                      (click)="copyShareLink()"
                      class="shrink-0 rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
                    >
                      {{ linkCopied() ? 'Copied!' : 'Copy link' }}
                    </button>
                  </div>
                  <button
                    (click)="stopSharing()"
                    class="self-start text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Stop sharing
                  </button>
                </div>
              } @else {
                <div class="flex items-center justify-between">
                  <p class="text-sm text-gray-600 dark:text-gray-400">Share this note with a public link</p>
                  <button
                    (click)="createShareLink()"
                    class="rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                  >
                    Create share link
                  </button>
                </div>
              }
            </div>
          }

          @if (archiving()) {
            <div class="px-4">
              <app-confirm-dialog
                message="Archive this note? You can restore it later from the archive."
                confirmLabel="Archive"
                (confirmed)="confirmArchive()"
                (cancelled)="archiving.set(false)"
              ></app-confirm-dialog>
            </div>
          }

          @if (deleting()) {
            <div class="px-4">
              <app-confirm-dialog
                message="Delete this note?"
                (confirmed)="confirmDelete()"
                (cancelled)="deleting.set(false)"
              ></app-confirm-dialog>
            </div>
          }

          <app-tiptap-editor
            #tiptapEditor
            (contentUpdated)="pendingContent = $event"
            (contentChanged)="onContentChanged($event)"
            (blurred)="saveNote()"
          />
        } @else {
          <div class="flex flex-1 items-center justify-center">
            <p class="text-gray-400">Select a note to edit</p>
          </div>
        }
      </div>
    }

    <!-- ── Desktop: original layout ────────────────────────── -->
    @if (!mobileMode()) {
      @if (!state.selectedSectionId()) {
        <div class="flex flex-1 items-center justify-center">
          <p class="text-gray-400">Select a section to see notes</p>
        </div>
      } @else {
        <div class="flex flex-1 overflow-hidden">
          <!-- Note list: collapsed strip or full panel -->
          @if (!fullscreen() && !hideNotesList()) {
            @if (collapsed()) {
              <div class="flex w-8 flex-col items-center border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <button
                  (click)="toggleCollapsed.emit()"
                  class="mt-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Expand notes"
                >
                  <fa-icon [icon]="faChevronRight" size="xs" />
                </button>
              </div>
            } @else {
              <div class="flex w-48 flex-col border-r border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                  <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</span>
                  <div class="flex items-center gap-1">
                    <button
                      (click)="toggleCollapsed.emit()"
                      class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Collapse panel"
                    >
                      <fa-icon [icon]="faChevronLeft" size="xs" />
                    </button>
                    <button
                      (click)="importNote()"
                      class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Import Markdown"
                    >
                      <fa-icon [icon]="faFileImport" size="sm" />
                    </button>
                    <button
                      (click)="createNote()"
                      class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="New note"
                    >
                      <fa-icon [icon]="faPlus" size="sm" />
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto p-1" cdkDropList (cdkDropListDropped)="onDrop($event)">
                  @for (note of state.notes(); track note.id) {
                    <div
                      cdkDrag
                      class="cursor-pointer rounded px-2 py-1.5 text-sm dark:text-gray-200"
                      [class.bg-blue-100]="note.id === state.selectedNoteId()"
                      [class.dark:bg-blue-900]="note.id === state.selectedNoteId()"
                      [class.hover:bg-gray-100]="note.id !== state.selectedNoteId()"
                      [class.dark:hover:bg-gray-700]="note.id !== state.selectedNoteId()"
                      (click)="onItemClick(note.id)"
                    >
                      <div class="flex items-center">
                        <fa-icon [icon]="faStickyNote" class="mr-2 text-gray-400" size="sm" />
                        <span class="truncate" [title]="note.title">{{ note.title || 'Untitled' }}</span>
                      </div>
                    </div>
                  } @empty {
                    <p class="px-2 py-4 text-center text-sm text-gray-400">
                      No notes yet. Click + to create one.
                    </p>
                  }
                </div>
              </div>
            }
          }

          <!-- Editor area -->
          <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
            @if (state.selectedNote()) {
              <!-- Editor header -->
              <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <input
                  type="text"
                  [value]="editedTitle()"
                  maxlength="75"
                  (input)="editedTitle.set($any($event.target).value)"
                  (blur)="saveNote()"
                  class="flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
                  placeholder="Note title"
                />
                <span class="ml-3 shrink-0 text-xs text-gray-400 dark:text-gray-500">{{ noteTimestamp() }}</span>
                <button
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleEditorToolbar()"
                  class="ml-2 shrink-0 rounded p-1"
                  [class]="isEditorToolbarVisible() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
                  title="Toggle formatting toolbar"
                >
                  <fa-icon [icon]="faBars" size="sm" />
                </button>
                <button
                  (click)="openPresentation()"
                  class="ml-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Present"
                >
                  <fa-icon [icon]="faDesktop" size="sm" />
                </button>
                <button
                  (click)="toggleFullscreen.emit()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  [title]="fullscreen() ? 'Exit full screen' : 'Full screen'"
                >
                  <fa-icon [icon]="fullscreen() ? faCompress : faExpand" size="sm" />
                </button>
                <button
                  (click)="toggleFavorite()"
                  class="ml-1 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                  [class]="state.selectedNote()?.favoritedAt ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  [title]="state.selectedNote()?.favoritedAt ? 'Remove from favorites' : 'Add to favorites'"
                >
                  <fa-icon [icon]="state.selectedNote()?.favoritedAt ? faStar : farStar" size="sm" />
                </button>
                <button
                  (click)="sharing.set(!sharing())"
                  class="ml-1 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                  [class]="state.selectedNote()?.shareToken ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  title="Share note"
                >
                  <fa-icon [icon]="faShareNodes" size="sm" />
                </button>
                <button
                  (click)="toggleTagging()"
                  class="ml-1 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                  [class]="noteTags().length > 0 ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  title="Tags"
                >
                  <fa-icon [icon]="faTag" size="sm" />
                </button>
                <button
                  (click)="moving.set(true)"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Move note"
                >
                  <fa-icon [icon]="faArrowRightArrowLeft" size="sm" />
                </button>
                <button
                  (click)="copyNote()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Duplicate note"
                >
                  <fa-icon [icon]="faCopy" size="sm" />
                </button>
                <button
                  (click)="exportNote()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Export as Markdown"
                >
                  <fa-icon [icon]="faDownload" size="sm" />
                </button>
                <button
                  (click)="startArchiving()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Archive note"
                >
                  <fa-icon [icon]="faBoxArchive" size="sm" />
                </button>
                <button
                  (click)="startDeleting()"
                  class="ml-1 rounded p-1 text-gray-400 hover:text-red-600"
                  title="Delete note"
                >
                  <fa-icon [icon]="faTrash" size="sm" />
                </button>
              </div>

              @if (tagging()) {
                <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <!-- Current tags -->
                  @if (noteTags().length > 0) {
                    <div class="mb-2 flex flex-wrap gap-1.5">
                      @for (tag of noteTags(); track tag.id) {
                        <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {{ tag.name }}
                          <button
                            (click)="removeTag(tag)"
                            class="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                            title="Remove tag"
                          >
                            <fa-icon [icon]="faXmark" size="xs" />
                          </button>
                        </span>
                      }
                    </div>
                  }
                  <!-- Add tag input -->
                  <div class="relative">
                    <input
                      type="text"
                      [value]="tagInput()"
                      (input)="tagInput.set($any($event.target).value)"
                      (keydown.enter)="addTag()"
                      class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                      placeholder="Add a tag…"
                      maxlength="30"
                    />
                    @if (filteredSuggestions().length > 0 && tagInput().length > 0) {
                      <ul class="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                        @for (suggestion of filteredSuggestions(); track suggestion.id) {
                          <li
                            (click)="addTagByName(suggestion.name)"
                            class="cursor-pointer px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                          >
                            {{ suggestion.name }}
                          </li>
                        }
                      </ul>
                    }
                  </div>
                </div>
              }

              @if (sharing()) {
                <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                  @if (state.selectedNote()?.shareToken) {
                    <div class="flex flex-col gap-2">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">This note is shared publicly</p>
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          readonly
                          [value]="getShareUrl()"
                          class="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        />
                        <button
                          (click)="copyShareLink()"
                          class="shrink-0 rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
                        >
                          {{ linkCopied() ? 'Copied!' : 'Copy link' }}
                        </button>
                      </div>
                      <button
                        (click)="stopSharing()"
                        class="self-start text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Stop sharing
                      </button>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between">
                      <p class="text-sm text-gray-600 dark:text-gray-400">Share this note with a public link</p>
                      <button
                        (click)="createShareLink()"
                        class="rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                      >
                        Create share link
                      </button>
                    </div>
                  }
                </div>
              }

              @if (archiving()) {
                <div class="px-4">
                  <app-confirm-dialog
                    message="Archive this note? You can restore it later from the archive."
                    confirmLabel="Archive"
                    (confirmed)="confirmArchive()"
                    (cancelled)="archiving.set(false)"
                  ></app-confirm-dialog>
                </div>
              }

              @if (deleting()) {
                <div class="px-4">
                  <app-confirm-dialog
                    message="Delete this note?"
                    (confirmed)="confirmDelete()"
                    (cancelled)="deleting.set(false)"
                  ></app-confirm-dialog>
                </div>
              }

              <app-tiptap-editor
                #tiptapEditor
                (contentChanged)="onContentChanged($event)"
                (blurred)="saveNote()"
              />
            } @else {
              <div class="flex flex-1 items-center justify-center">
                <p class="text-gray-400">Select a note to edit</p>
              </div>
            }
          </div>
        </div>
      }
    }

    <!-- ── Move note dialog ──────────────────────────────────── -->
    @if (moving() && state.selectedNote()) {
      <app-move-note-dialog
        [currentSectionId]="state.selectedNote()!.sectionId"
        (moved)="onMoved($event)"
        (cancelled)="moving.set(false)"
      />
    }

    <!-- ── Presentation mode overlay ──────────────────────────── -->
    @if (presentationOpen() && state.selectedNote()) {
      <app-presentation-view
        [title]="state.selectedNote()!.title"
        [content]="presentationContent()"
        (closed)="presentationOpen.set(false)"
      />
    }

    <!-- Hidden file input for markdown import -->
    <input
      #fileInput
      type="file"
      accept=".md,.markdown,.txt"
      class="hidden"
      (change)="onFileSelected($event)"
    />
  `,
})
export class NoteArea {
  protected state = inject(ShellStateService);
  protected vp = inject(ViewportService);
  private tagSvc = inject(TagService);

  collapsed = input(false);
  fullscreen = input(false);
  hideNotesList = input(false);
  mobileMode = input(false);
  showEditorOnly = input(false);
  toggleCollapsed = output();
  toggleFullscreen = output();

  protected faStickyNote = faStickyNote;
  protected faPlus = faPlus;
  protected faTrash = faTrash;
  protected faChevronLeft = faChevronLeft;
  protected faChevronRight = faChevronRight;
  protected faExpand = faExpand;
  protected faCompress = faCompress;
  protected faDesktop = faDesktop;
  protected faCopy = faCopy;
  protected faArrowRightArrowLeft = faArrowRightArrowLeft;
  protected faDownload = faDownload;
  protected faFileImport = faFileImport;
  protected faBoxArchive = faBoxArchive;
  protected faStar = faStar;
  protected farStar = farStar;
  protected faBars = faBars;
  protected faShareNodes = faShareNodes;
  protected faTag = faTag;
  protected faXmark = faXmark;

  protected sharing = signal(false);
  protected linkCopied = signal(false);
  protected moving = signal(false);
  protected archiving = signal(false);
  protected presentationOpen = signal(false);
  protected presentationContent = signal('');
  protected editedTitle = signal('');
  protected deleting = signal(false);

  // Tag management
  protected tagging = signal(false);
  protected noteTags = signal<TagDto[]>([]);
  protected userTags = signal<TagWithCountDto[]>([]);
  protected tagInput = signal('');
  protected filteredSuggestions = computed(() => {
    const input = this.tagInput().toLowerCase().trim();
    if (!input) return [];
    const currentTagIds = new Set(this.noteTags().map((t) => t.id));
    return this.userTags().filter(
      (t) => t.name.toLowerCase().includes(input) && !currentTagIds.has(t.id)
    );
  });

  protected noteTimestamp = computed(() => {
    const note = this.state.selectedNote();
    if (!note) return '';
    const isNew = note.createdAt === note.updatedAt;
    const date = new Date(isNew ? note.createdAt : note.updatedAt);
    const label = isNew ? 'Created' : 'Updated';
    return `${label} ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  });
  private dragged = false;

  // TipTap editor ref
  protected tiptapEditor = viewChild<TiptapEditor>('tiptapEditor');
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Track latest content from TipTap (for saving)
  protected pendingContent: string | null = null;

  // Track which note & editor instance have been synced
  private syncedNoteId: number | null = null;
  private syncedEditorRef: TiptapEditor | undefined = undefined;

  protected toggleEditorToolbar(): void {
    this.tiptapEditor()?.toggleToolbar();
  }

  protected isEditorToolbarVisible(): boolean {
    return this.tiptapEditor()?.isToolbarVisible() ?? true;
  }

  protected openPresentation(): void {
    const editor = this.tiptapEditor();
    this.presentationContent.set(editor ? editor.getHTML() : this.state.selectedNote()?.content ?? '');
    this.presentationOpen.set(true);
  }

  constructor() {
    // Sync local editor state when the selected note OR editor instance changes.
    // The editor instance changes when toggling between mobile/desktop viewport
    // because each mode has its own <app-tiptap-editor> in a separate @if branch.
    effect(() => {
      const note = this.state.selectedNote();
      const editor = this.tiptapEditor();
      const editorChanged = editor !== this.syncedEditorRef;

      if (note && (note.id !== this.syncedNoteId || (editorChanged && editor))) {
        // Editor swapped for the same note (viewport switch) — preserve pending edits
        const contentForEditor = (editorChanged && note.id === this.syncedNoteId && this.pendingContent !== null)
          ? this.pendingContent
          : note.content;

        if (note.id !== this.syncedNoteId) {
          this.editedTitle.set(note.title);
          this.deleting.set(false);
          this.sharing.set(false);
          this.linkCopied.set(false);
          this.tagging.set(false);
          this.noteTags.set([]);
          this.tagInput.set('');
        }

        this.pendingContent = null;
        if (editor) {
          editor.setContent(contentForEditor);
          this.syncedNoteId = note.id;
          this.syncedEditorRef = editor;
        }
      } else if (!note) {
        this.syncedNoteId = null;
        this.syncedEditorRef = undefined;
        this.editedTitle.set('');
        this.pendingContent = null;
        if (editor) {
          editor.setContent('');
        }
        this.deleting.set(false);
      }
    });
  }

  protected createNote(): void {
    this.state.createNote('Untitled note');
  }

  protected onContentChanged(html: string): void {
    this.pendingContent = html;
  }

  protected saveNote(): void {
    const note = this.state.selectedNote();
    if (!note) return;

    const title = this.editedTitle().trim();
    const editor = this.tiptapEditor();
    const content = this.pendingContent ?? editor?.getHTML() ?? '';

    // Treat empty paragraph as empty content
    const normalizedContent = content === '<p></p>' ? '' : content;

    if (title === note.title && normalizedContent === note.content) return;

    this.state.updateNote(note.id, {
      title: title || note.title,
      content: normalizedContent,
    });
  }

  protected onMoved(targetSectionId: number): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (note) {
      this.state.moveNote(note.id, targetSectionId);
    }
    this.moving.set(false);
  }

  protected copyNote(): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (note) {
      this.state.duplicateNote(note.id);
    }
  }

  protected exportNote(): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (!note) return;
    const editor = this.tiptapEditor();
    const content = editor ? editor.getHTML() : note.content;
    exportNoteAsMarkdown(note.title, content);
  }

  protected importNote(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const { title, html } = await parseMarkdownFile(file);
    this.state.createNote(title, html);

    // Reset so the same file can be re-imported
    input.value = '';
  }

  protected getShareUrl(): string {
    const token = this.state.selectedNote()?.shareToken;
    return token ? `${window.location.origin}/shared/${token}` : '';
  }

  protected createShareLink(): void {
    const note = this.state.selectedNote();
    if (note) {
      this.state.shareNote(note.id);
    }
  }

  protected async copyShareLink(): Promise<void> {
    const url = this.getShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    }
  }

  protected stopSharing(): void {
    const note = this.state.selectedNote();
    if (note) {
      this.state.unshareNote(note.id);
    }
  }

  protected toggleFavorite(): void {
    const note = this.state.selectedNote();
    if (!note) return;
    if (note.favoritedAt) {
      this.state.unfavoriteNote(note.id);
    } else {
      this.state.favoriteNote(note.id);
    }
  }

  protected startArchiving(): void {
    this.archiving.set(true);
  }

  protected confirmArchive(): void {
    const note = this.state.selectedNote();
    if (note) {
      this.state.archiveNote(note.id);
    }
    this.archiving.set(false);
  }

  protected startDeleting(): void {
    this.deleting.set(true);
  }

  protected confirmDelete(): void {
    const note = this.state.selectedNote();
    if (note) {
      this.state.deleteNote(note.id);
    }
    this.deleting.set(false);
  }

  protected onDrop(event: CdkDragDrop<NoteDto[]>): void {
    this.dragged = true;
    if (event.previousIndex === event.currentIndex) return;
    const list = [...this.state.notes()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.state.reorderNotes(list);
  }

  protected onItemClick(id: number): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    this.state.selectNote(id);
  }

  // ── Tag management ──────────────────────────────────────────────

  protected toggleTagging(): void {
    const opening = !this.tagging();
    this.tagging.set(opening);
    if (opening) {
      const note = this.state.selectedNote();
      if (note) {
        this.tagSvc.getTagsForNote(note.id).subscribe((tags) => this.noteTags.set(tags));
        this.tagSvc.getAll().subscribe((tags) => this.userTags.set(tags));
      }
      requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>('input[placeholder="Add a tag…"]')?.focus();
      });
    }
  }

  protected addTag(): void {
    const name = this.tagInput().trim();
    if (!name) return;
    const note = this.state.selectedNote();
    if (!note) return;
    this.addTagByName(name);
  }

  protected addTagByName(name: string): void {
    const note = this.state.selectedNote();
    if (!note) return;
    this.tagSvc.addTagToNote(note.id, name).subscribe((tag) => {
      // Add to noteTags if not already present
      if (!this.noteTags().some((t) => t.id === tag.id)) {
        this.noteTags.update((list) => [...list, tag]);
      }
      this.tagInput.set('');
      // Refresh user tags to update counts
      this.tagSvc.getAll().subscribe((tags) => this.userTags.set(tags));
    });
  }

  protected removeTag(tag: TagDto): void {
    const note = this.state.selectedNote();
    if (!note) return;
    this.tagSvc.removeTagFromNote(note.id, tag.id).subscribe(() => {
      this.noteTags.update((list) => list.filter((t) => t.id !== tag.id));
      // Refresh user tags to update counts
      this.tagSvc.getAll().subscribe((tags) => this.userTags.set(tags));
    });
  }
}
