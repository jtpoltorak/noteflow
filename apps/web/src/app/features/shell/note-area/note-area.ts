import { Component, ElementRef, inject, signal, effect, input, output, viewChild, computed } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop, CdkDragEnd, moveItemInArray } from '@angular/cdk/drag-drop';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faPlus, faTrash, faChevronLeft, faChevronRight, faExpand, faCompress, faDesktop, faCopy, faArrowRightArrowLeft, faDownload, faFileImport, faBoxArchive, faStar, faBars, faShareNodes, faTag, faXmark, faLock, faLockOpen, faWandMagicSparkles, faFileCirclePlus, faPrint, faCircleInfo, faFont, faQuoteLeft, faTextHeight } from '@fortawesome/free-solid-svg-icons';
import { EditorPreferencesService } from '../../../core/services/editor-preferences.service';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { ShellStateService } from '../shell-state.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { TiptapEditor } from './tiptap-editor/tiptap-editor';
import { PresentationView } from './presentation-view';
import { MoveNoteDialog } from './move-note-dialog';
import { PasswordDialog } from '../../../shared/password-dialog/password-dialog';
import { exportNoteAsMarkdown } from '../../../core/utils/export-markdown';
import { parseMarkdownFile } from '../../../core/utils/import-markdown';
import { TagService } from '../../../core/services/tag.service';
import { NoteService } from '../../../core/services/note.service';
import { TemplatePicker, type SelectedTemplate } from '../../../shared/template-picker/template-picker';
import { TemplateService } from '../../../core/services/template.service';
import type { NoteDto, TagDto, TagWithCountDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-note-area',
  imports: [FaIconComponent, ConfirmDialog, CdkDropList, CdkDrag, TiptapEditor, PresentationView, MoveNoteDialog, PasswordDialog, TemplatePicker],
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
                  @if (note.isLocked && !unlockedNoteIds().has(note.id)) {
                    <fa-icon [icon]="faLock" class="ml-auto shrink-0 text-gray-400" size="xs" />
                  }
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
          <div class="flex flex-wrap items-center gap-y-1 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <input
              type="text"
              [value]="editedTitle()"
              maxlength="75"
              (input)="editedTitle.set($any($event.target).value)"
              (blur)="saveNote()"
              class="min-w-0 flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
              placeholder="Note title"
            />
            <!-- Note actions -->
            <button
              (click)="toggleFavorite()"
              class="ml-2 shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
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
              (click)="toggleLocking()"
              class="ml-1 shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              [class]="state.selectedNote()?.isLocked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
              [title]="state.selectedNote()?.isLocked ? 'Remove password' : 'Set password'"
            >
              <fa-icon [icon]="state.selectedNote()?.isLocked ? faLock : faLockOpen" size="sm" />
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
              (click)="printNote()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Print note"
            >
              <fa-icon [icon]="faPrint" size="sm" />
            </button>
            <button
              (click)="saveAsTemplate()"
              class="ml-1 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Save as template"
            >
              <fa-icon [icon]="faFileCirclePlus" size="sm" />
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
            <!-- View toggles (global) -->
            <div class="ml-2 h-5 w-px shrink-0 bg-gray-300 dark:bg-gray-600"></div>
            <span class="ml-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">View</span>
            <button
              (mousedown)="$event.preventDefault()"
              (click)="toggleEditorToolbar()"
              class="ml-1.5 shrink-0 rounded p-1"
              [class]="isEditorToolbarVisible() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
              title="Toggle formatting toolbar"
            >
              <fa-icon [icon]="faBars" size="sm" />
            </button>
            <button
              (mousedown)="$event.preventDefault()"
              (click)="editorPrefs.toggleSerif()"
              class="ml-1 shrink-0 rounded p-1"
              [class]="editorPrefs.serifMode() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
              title="Toggle serif font"
            >
              <fa-icon [icon]="faFont" size="sm" />
            </button>
            <button
              (click)="editorPrefs.toggleMetadata()"
              class="ml-1 shrink-0 rounded p-1"
              [class]="editorPrefs.showMetadata() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
              title="Toggle note info"
            >
              <fa-icon [icon]="faCircleInfo" size="sm" />
            </button>
            <button
              (click)="editorPrefs.toggleTypography()"
              class="ml-1 shrink-0 rounded p-1"
              [class]="editorPrefs.typographyMode() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
              title="Toggle smart typography"
            >
              <fa-icon [icon]="faQuoteLeft" size="sm" />
            </button>
            <button
              (click)="editorPrefs.cycleFontSize()"
              class="ml-1 shrink-0 rounded p-1"
              [class]="editorPrefs.fontSize() !== 'default' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
              [title]="'Font size: ' + fontSizeLabel()"
            >
              <fa-icon [icon]="faTextHeight" size="sm" />
            </button>
          </div>

          @if (locking()) {
            <div class="px-4">
              @if (state.selectedNote()?.isLocked) {
                <app-password-dialog
                  message="Enter current password to remove protection"
                  placeholder="Current password"
                  submitLabel="Remove password"
                  (submitted)="confirmUnlock($event)"
                  (cancelled)="locking.set(false)"
                />
              } @else {
                <app-password-dialog
                  message="Set a password to protect this note"
                  submitLabel="Set password"
                  [showConfirm]="true"
                  (submitted)="confirmLock($event)"
                  (cancelled)="locking.set(false)"
                />
              }
            </div>
          }

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

          @if (isNoteLocked()) {
            <div class="flex flex-1 flex-col items-center justify-center gap-4 p-8">
              <fa-icon [icon]="faLock" class="text-gray-300 dark:text-gray-600" size="3x" />
              <p class="text-sm text-gray-500 dark:text-gray-400">This note is password-protected</p>
              <div class="w-64">
                <input
                  #mobileAccessInput
                  type="password"
                  placeholder="Enter password"
                  class="mb-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  (keydown.enter)="accessNote(mobileAccessInput.value, mobileAccessInput)"
                />
                @if (accessError()) {
                  <p class="mb-2 text-xs text-red-600 dark:text-red-400">{{ accessError() }}</p>
                }
                <button
                  (click)="accessNote(mobileAccessInput.value, mobileAccessInput)"
                  class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Unlock
                </button>
              </div>
            </div>
          } @else {
            <app-tiptap-editor
              #tiptapEditor
              [noteId]="state.selectedNoteId()"
              (contentUpdated)="pendingContent = $event"
              (contentChanged)="onContentChanged($event)"
              (blurred)="saveNote()"
            />
            @if (editorPrefs.showMetadata() && state.selectedNote()) {
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 bg-gray-50 px-4 py-1.5 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                <span>Created {{ formatDate(state.selectedNote()!.createdAt) }}</span>
                <span>Modified {{ formatDate(state.selectedNote()!.updatedAt) }}</span>
                <span>{{ textStats().words }} words</span>
                <span>{{ textStats().characters }} chars</span>
                <span>{{ textStats().paragraphs }} paragraphs</span>
                <span>{{ readingTime() }}</span>
              </div>
            }
            @if (isNoteEmpty()) {
              <div class="pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex justify-center">
                <button
                  (mousedown)="$event.preventDefault(); applyTemplate()"
                  class="pointer-events-auto flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                >
                  <fa-icon [icon]="faWandMagicSparkles" size="xs" />
                  Use a template
                </button>
              </div>
            }
          }
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
                      (cdkDragStarted)="onNoteDragStarted()"
                      (cdkDragEnded)="onNoteDragEnded($event, note.id)"
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
                        @if (note.isLocked && !unlockedNoteIds().has(note.id)) {
                          <fa-icon [icon]="faLock" class="ml-auto shrink-0 text-gray-400" size="xs" />
                        }
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
              <div class="flex flex-wrap items-center gap-y-1 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <input
                  type="text"
                  [value]="editedTitle()"
                  maxlength="75"
                  (input)="editedTitle.set($any($event.target).value)"
                  (blur)="saveNote()"
                  class="min-w-0 flex-1 bg-transparent text-lg font-semibold text-gray-800 focus:outline-none dark:text-gray-100"
                  placeholder="Note title"
                />
                <!-- Note actions -->
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
                  (click)="toggleLocking()"
                  class="ml-1 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                  [class]="state.selectedNote()?.isLocked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  [title]="state.selectedNote()?.isLocked ? 'Remove password' : 'Set password'"
                >
                  <fa-icon [icon]="state.selectedNote()?.isLocked ? faLock : faLockOpen" size="sm" />
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
                  (click)="printNote()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Print note"
                >
                  <fa-icon [icon]="faPrint" size="sm" />
                </button>
                <button
                  (click)="saveAsTemplate()"
                  class="ml-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title="Save as template"
                >
                  <fa-icon [icon]="faFileCirclePlus" size="sm" />
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
                <!-- View toggles (global) -->
                <div class="ml-2 h-5 w-px shrink-0 bg-gray-300 dark:bg-gray-600"></div>
                <span class="ml-2 shrink-0 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">View</span>
                <button
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleEditorToolbar()"
                  class="ml-1.5 shrink-0 rounded p-1"
                  [class]="isEditorToolbarVisible() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
                  title="Toggle formatting toolbar"
                >
                  <fa-icon [icon]="faBars" size="sm" />
                </button>
                <button
                  (mousedown)="$event.preventDefault()"
                  (click)="editorPrefs.toggleSerif()"
                  class="ml-1 shrink-0 rounded p-1"
                  [class]="editorPrefs.serifMode() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
                  title="Toggle serif font"
                >
                  <fa-icon [icon]="faFont" size="sm" />
                </button>
                <button
                  (click)="editorPrefs.toggleMetadata()"
                  class="ml-1 shrink-0 rounded p-1"
                  [class]="editorPrefs.showMetadata() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
                  title="Toggle note info"
                >
                  <fa-icon [icon]="faCircleInfo" size="sm" />
                </button>
                <button
                  (click)="editorPrefs.toggleTypography()"
                  class="ml-1 shrink-0 rounded p-1"
                  [class]="editorPrefs.typographyMode() ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
                  title="Toggle smart typography"
                >
                  <fa-icon [icon]="faQuoteLeft" size="sm" />
                </button>
                <button
                  (click)="editorPrefs.cycleFontSize()"
                  class="ml-1 shrink-0 rounded p-1"
                  [class]="editorPrefs.fontSize() !== 'default' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
                  [title]="'Font size: ' + fontSizeLabel()"
                >
                  <fa-icon [icon]="faTextHeight" size="sm" />
                </button>
              </div>

              @if (locking()) {
                <div class="px-4">
                  @if (state.selectedNote()?.isLocked) {
                    <app-password-dialog
                      message="Enter current password to remove protection"
                      placeholder="Current password"
                      submitLabel="Remove password"
                      (submitted)="confirmUnlock($event)"
                      (cancelled)="locking.set(false)"
                    />
                  } @else {
                    <app-password-dialog
                      message="Set a password to protect this note"
                      submitLabel="Set password"
                      [showConfirm]="true"
                      (submitted)="confirmLock($event)"
                      (cancelled)="locking.set(false)"
                    />
                  }
                </div>
              }

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

              @if (isNoteLocked()) {
                <div class="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                  <fa-icon [icon]="faLock" class="text-gray-300 dark:text-gray-600" size="3x" />
                  <p class="text-sm text-gray-500 dark:text-gray-400">This note is password-protected</p>
                  <div class="w-64">
                    <input
                      #desktopAccessInput
                      type="password"
                      placeholder="Enter password"
                      class="mb-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      (keydown.enter)="accessNote(desktopAccessInput.value, desktopAccessInput)"
                    />
                    @if (accessError()) {
                      <p class="mb-2 text-xs text-red-600 dark:text-red-400">{{ accessError() }}</p>
                    }
                    <button
                      (click)="accessNote(desktopAccessInput.value, desktopAccessInput)"
                      class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              } @else {
                <app-tiptap-editor
                  #tiptapEditor
                  [noteId]="state.selectedNoteId()"
                  (contentChanged)="onContentChanged($event)"
                  (blurred)="saveNote()"
                />
                @if (editorPrefs.showMetadata() && state.selectedNote()) {
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 bg-gray-50 px-4 py-1.5 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                    <span>Created {{ formatDate(state.selectedNote()!.createdAt) }}</span>
                    <span>Modified {{ formatDate(state.selectedNote()!.updatedAt) }}</span>
                    <span>{{ textStats().words }} words</span>
                    <span>{{ textStats().characters }} chars</span>
                    <span>{{ textStats().paragraphs }} paragraphs</span>
                    <span>{{ readingTime() }}</span>
                  </div>
                }
                @if (isNoteEmpty()) {
                  <div class="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button
                      (click)="applyTemplate()"
                      class="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                    >
                      <fa-icon [icon]="faWandMagicSparkles" size="xs" />
                      Use a template
                    </button>
                  </div>
                }
              }
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

    <!-- Template picker -->
    <app-template-picker
      [open]="showTemplatePicker()"
      (closed)="showTemplatePicker.set(false)"
      (selected)="onTemplateSelected($event)"
    />

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
  protected editorPrefs = inject(EditorPreferencesService);
  private tagSvc = inject(TagService);
  private noteSvc = inject(NoteService);
  private templateSvc = inject(TemplateService);

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
  protected faLock = faLock;
  protected faLockOpen = faLockOpen;
  protected faWandMagicSparkles = faWandMagicSparkles;
  protected faFileCirclePlus = faFileCirclePlus;
  protected faPrint = faPrint;
  protected faCircleInfo = faCircleInfo;
  protected faFont = faFont;
  protected faQuoteLeft = faQuoteLeft;
  protected faTextHeight = faTextHeight;

  protected fontSizeLabel = computed(() => {
    const labels: Record<string, string> = { default: 'Default', large: 'Large', xl: 'Extra Large', xxl: 'Extra Extra Large' };
    return labels[this.editorPrefs.fontSize()] ?? 'Default';
  });

  protected showTemplatePicker = signal(false);
  protected templatePickerMode = signal<'create' | 'apply'>('create');

  protected isNoteEmpty = computed(() => {
    const note = this.state.selectedNote();
    if (!note) return false;
    const content = this.pendingContent ?? note.content;
    return !content || content === '<p></p>' || content.trim() === '';
  });

  protected sharing = signal(false);
  protected linkCopied = signal(false);
  protected moving = signal(false);
  protected archiving = signal(false);
  protected locking = signal(false);
  protected accessError = signal('');
  protected unlockedNoteIds = signal(new Set<number>());
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

  protected isNoteLocked = computed(() => {
    const note = this.state.selectedNote();
    if (!note?.isLocked) return false;
    return !this.unlockedNoteIds().has(note.id);
  });

  protected textStats = signal({ words: 0, characters: 0, paragraphs: 0 });

  protected noteTimestamp = computed(() => {
    const note = this.state.selectedNote();
    if (!note) return '';
    const isNew = note.createdAt === note.updatedAt;
    const date = new Date(isNew ? note.createdAt : note.updatedAt);
    const label = isNew ? 'Created' : 'Updated';
    return `${label} ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  });

  protected readingTime = computed(() => {
    const words = this.textStats().words;
    if (words === 0) return '0 min read';
    const minutes = Math.ceil(words / 200);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
  });

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }
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
          this.locking.set(false);
          this.accessError.set('');
          this.tagging.set(false);
          this.noteTags.set([]);
          this.tagInput.set('');
          this.tagSvc.getTagsForNote(note.id).subscribe((tags) => this.noteTags.set(tags));
        }

        this.pendingContent = null;
        if (editor) {
          editor.setContent(contentForEditor);
          this.syncedNoteId = note.id;
          this.syncedEditorRef = editor;
          // Refresh text stats after content is set
          requestAnimationFrame(() => this.refreshTextStats());
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
    this.templatePickerMode.set('create');
    this.showTemplatePicker.set(true);
  }

  protected applyTemplate(): void {
    this.templatePickerMode.set('apply');
    this.showTemplatePicker.set(true);
  }

  protected onTemplateSelected(template: SelectedTemplate): void {
    this.showTemplatePicker.set(false);

    if (this.templatePickerMode() === 'create') {
      const title = template ? template.name : 'Untitled note';
      const content = template ? template.content.trim() : undefined;
      this.state.createNote(title, content);
    } else {
      // Apply mode — set content on the current note
      if (!template) return;
      const editor = this.tiptapEditor();
      if (editor) {
        editor.setContent(template.content.trim());
        this.pendingContent = template.content.trim();
        this.saveNote();
      }
    }
  }

  protected saveAsTemplate(): void {
    const note = this.state.selectedNote();
    if (!note) return;
    const editor = this.tiptapEditor();
    const content = editor ? editor.getHTML() : note.content;
    if (!content || content === '<p></p>') return;

    const name = prompt('Template name:', note.title);
    if (!name) return;

    this.templateSvc.create({ name, content }).subscribe();
  }

  protected onContentChanged(html: string): void {
    this.pendingContent = html;
    this.refreshTextStats();
  }


  private refreshTextStats(): void {
    const editor = this.tiptapEditor();
    if (editor) {
      this.textStats.set(editor.getTextStats());
    }
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

  protected printNote(): void {
    this.saveNote();
    const note = this.state.selectedNote();
    if (!note) return;
    const editor = this.tiptapEditor();
    const content = editor ? editor.getHTML() : note.content;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${note.title}</title>
  <style>
    body {
      font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
      color: #1f2937;
      line-height: 1.6;
    }
    h1.print-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }
    h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
    h2 { font-size: 1.5rem; font-weight: 600; margin: 0.625rem 0 0.375rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
    p { margin-bottom: 0.5rem; }
    ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
    ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
    li { margin-bottom: 0.125rem; }
    li p { margin-bottom: 0; }
    pre { background: #f3f4f6; border-radius: 0.375rem; padding: 0.75rem 1rem; overflow-x: auto; font-family: monospace; font-size: 0.875rem; }
    pre code { background: none; padding: 0; }
    code { background: #f3f4f6; border-radius: 0.25rem; padding: 0.125rem 0.25rem; font-family: monospace; font-size: 0.875em; }
    blockquote { border-left: 3px solid #d1d5db; padding: 0.5rem 1rem; margin: 0.5rem 0; color: #6b7280; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 1rem 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 0.375rem 0.625rem; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.5rem 0; }
    a { color: #3b82f6; text-decoration: underline; }
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
    ul[data-type="taskList"] li label input[type="checkbox"] { margin-top: 0.35rem; }
    ul[data-type="taskList"] li[data-checked="true"] > div p { text-decoration: line-through; color: #9ca3af; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <h1 class="print-title">${note.title}</h1>
  ${content}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

  protected onNoteDragStarted(): void {
    this.dragged = false;
    this.state.draggingType.set('note');
  }

  protected onNoteDragEnded(event: CdkDragEnd, noteId: number): void {
    this.state.draggingType.set(null);
    if (this.dragged) return;

    const el = document.elementFromPoint(event.dropPoint.x, event.dropPoint.y);
    const target = el?.closest('[data-section-id]');
    if (!target) return;

    const targetSectionId = Number(target.getAttribute('data-section-id'));
    if (!targetSectionId || targetSectionId === this.state.selectedSectionId()) return;

    // Hide the CDK return animation — the item is moving cross-panel
    document.querySelector<HTMLElement>('.cdk-drag-preview')?.style.setProperty('opacity', '0');

    this.state.moveNote(noteId, targetSectionId);

    // CDK's cdkDropListDropped fires after cdkDragEnded (returning the item),
    // which sets dragged=true via onDrop. Reset after CDK events settle so the
    // next click isn't consumed by the dragged guard in onItemClick.
    setTimeout(() => (this.dragged = false));
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

  // ── Password protection ──────────────────────────────────────────

  protected toggleLocking(): void {
    this.locking.set(!this.locking());
  }

  protected confirmLock(password: string): void {
    const note = this.state.selectedNote();
    if (!note) return;
    this.state.lockNote(note.id, password);
    this.locking.set(false);
  }

  protected confirmUnlock(password: string): void {
    const note = this.state.selectedNote();
    if (!note) return;
    this.noteSvc.unlock(note.id, password).subscribe({
      next: () => {
        this.state.notes.update((list) =>
          list.map((n) => (n.id === note.id ? { ...n, isLocked: false } : n))
        );
        this.unlockedNoteIds.update((ids) => {
          ids.delete(note.id);
          return new Set(ids);
        });
        this.locking.set(false);
      },
      error: () => this.accessError.set('Incorrect password'),
    });
  }

  protected accessNote(password: string, inputEl: HTMLInputElement): void {
    const note = this.state.selectedNote();
    if (!note) return;
    this.accessError.set('');
    this.noteSvc.access(note.id, password).subscribe({
      next: (fullNote) => {
        // Store full content in notes list
        this.state.notes.update((list) => list.map((n) => (n.id === note.id ? fullNote : n)));
        // Mark as unlocked for this session
        this.unlockedNoteIds.update((ids) => new Set(ids).add(note.id));
        this.accessError.set('');
      },
      error: () => {
        this.accessError.set('Incorrect password');
        inputEl.value = '';
        inputEl.focus();
      },
    });
  }
}
