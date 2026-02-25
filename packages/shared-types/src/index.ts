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
}

// ── Response DTOs ─────────────────────────────────────────────

export interface UserDto {
  id: number;
  email: string;
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
  createdAt: string;
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
