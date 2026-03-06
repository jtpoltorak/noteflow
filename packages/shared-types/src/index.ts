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

// ── Response DTOs ─────────────────────────────────────────────

export interface UserDto {
  id: number;
  email: string;
  darkMode: boolean;
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
