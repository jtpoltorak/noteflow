// ── Request DTOs ──────────────────────────────────────────────

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateNotebookDto {
  title: string;
}

export interface UpdateNotebookDto {
  title?: string;
  order?: number;
}

export interface CreateSectionDto {
  title: string;
}

export interface UpdateSectionDto {
  title?: string;
  order?: number;
  notebookId?: number;
}

export interface CreateNoteDto {
  title: string;
  content?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  order?: number;
  sectionId?: number;
}

export interface UpdatePreferencesDto {
  darkMode?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserTemplateDto {
  name: string;
  description?: string;
  content: string;
  category?: string;
}

export interface UpdateUserTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  category?: string;
}

// ── Response DTOs ─────────────────────────────────────────────

export interface UserDto {
  id: number;
  email: string;
  darkMode: boolean;
  skipRecycleBin: boolean;
  deleteRequestedAt: string | null;
}

export interface CloseAccountDto {
  password: string;
}

export interface AccountClosureStatusDto {
  deleteRequestedAt: string;
  deletionDate: string;
}

export interface NotebookDto {
  id: number;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDto {
  id: number;
  notebookId: number;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDto {
  id: number;
  sectionId: number;
  title: string;
  content: string;
  order: number;
  archivedAt: string | null;
  favoritedAt: string | null;
  shareToken: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedNoteDto {
  title: string;
  content: string;
  updatedAt: string;
}

export interface SharedNoteListDto {
  id: number;
  title: string;
  shareToken: string;
  sectionId: number;
  sectionTitle: string;
  notebookId: number;
  notebookTitle: string;
  updatedAt: string;
}

export interface ArchivedNoteDto {
  id: number;
  title: string;
  sectionId: number;
  sectionTitle: string;
  notebookId: number;
  notebookTitle: string;
  archivedAt: string;
  updatedAt: string;
}

export interface UnarchiveNoteDto {
  sectionId: number;
}

export interface FavoriteNoteDto {
  id: number;
  title: string;
  sectionId: number;
  sectionTitle: string;
  notebookId: number;
  notebookTitle: string;
  favoritedAt: string;
  updatedAt: string;
}

export interface SearchResultDto {
  noteId: number;
  noteTitle: string;
  sectionId: number;
  sectionTitle: string;
  notebookId: number;
  notebookTitle: string;
  snippet: string;
  archivedAt: string | null;
  updatedAt: string;
}

// ── User Template DTOs ───────────────────────────────────────

export interface UserTemplateDto {
  id: number;
  name: string;
  description: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// ── Image DTOs ──────────────────────────────────────────────

export interface ImageDto {
  id: number;
  noteId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

// ── Audio DTOs ─────────────────────────────────────────────

export interface AudioDto {
  id: number;
  noteId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

// ── Tag DTOs ─────────────────────────────────────────────────

export interface TagDto {
  id: number;
  name: string;
  createdAt: string;
}

export interface TagWithCountDto {
  id: number;
  name: string;
  noteCount: number;
}

export interface TaggedNoteDto {
  id: number;
  title: string;
  sectionId: number;
  sectionTitle: string;
  notebookId: number;
  notebookTitle: string;
  updatedAt: string;
}

// ── Recycle Bin DTOs ────────────────────────────────────────────

export interface DeletedNotebookDto {
  id: number;
  title: string;
  deletedAt: string;
}

export interface DeletedSectionDto {
  id: number;
  title: string;
  notebookId: number;
  notebookTitle: string;
  deletedAt: string;
}

export interface DeletedNoteDto {
  id: number;
  title: string;
  sectionId: number;
  sectionTitle: string;
  notebookId: number;
  notebookTitle: string;
  deletedAt: string;
}

export interface RecycleBinDto {
  notebooks: DeletedNotebookDto[];
  sections: DeletedSectionDto[];
  notes: DeletedNoteDto[];
}

// ── Note Link DTOs ──────────────────────────────────────────────

export interface NoteLinkContextDto {
  noteId: number;
  noteTitle: string;
  sectionId: number;
  notebookId: number;
}

// ── API Response Wrappers ─────────────────────────────────────

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}
