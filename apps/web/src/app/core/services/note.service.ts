import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, NoteDto, ArchivedNoteDto, FavoriteNoteDto, SharedNoteListDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getBySection(sectionId: number): Observable<NoteDto[]> {
    return this.http
      .get<ApiSuccessResponse<NoteDto[]>>(`${this.api}/sections/${sectionId}/notes`)
      .pipe(map((r) => r.data));
  }

  getById(id: number): Observable<NoteDto> {
    return this.http
      .get<ApiSuccessResponse<NoteDto>>(`${this.api}/notes/${id}`)
      .pipe(map((r) => r.data));
  }

  create(sectionId: number, title: string, content?: string): Observable<NoteDto> {
    return this.http
      .post<ApiSuccessResponse<NoteDto>>(`${this.api}/sections/${sectionId}/notes`, { title, content })
      .pipe(map((r) => r.data));
  }

  update(id: number, updates: { title?: string; content?: string; order?: number; sectionId?: number }): Observable<NoteDto> {
    return this.http
      .put<ApiSuccessResponse<NoteDto>>(`${this.api}/notes/${id}`, updates)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/notes/${id}`);
  }

  archive(id: number): Observable<void> {
    return this.http.post<void>(`${this.api}/notes/${id}/archive`, {});
  }

  unarchive(id: number, sectionId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/notes/${id}/unarchive`, { sectionId });
  }

  getArchived(): Observable<ArchivedNoteDto[]> {
    return this.http
      .get<ApiSuccessResponse<ArchivedNoteDto[]>>(`${this.api}/notes/archived`)
      .pipe(map((r) => r.data));
  }

  favorite(id: number): Observable<void> {
    return this.http.post<void>(`${this.api}/notes/${id}/favorite`, {});
  }

  unfavorite(id: number): Observable<void> {
    return this.http.post<void>(`${this.api}/notes/${id}/unfavorite`, {});
  }

  getFavorites(): Observable<FavoriteNoteDto[]> {
    return this.http
      .get<ApiSuccessResponse<FavoriteNoteDto[]>>(`${this.api}/notes/favorites`)
      .pipe(map((r) => r.data));
  }

  getShared(): Observable<SharedNoteListDto[]> {
    return this.http
      .get<ApiSuccessResponse<SharedNoteListDto[]>>(`${this.api}/notes/shared`)
      .pipe(map((r) => r.data));
  }

  share(id: number): Observable<{ shareToken: string }> {
    return this.http
      .post<ApiSuccessResponse<{ shareToken: string }>>(`${this.api}/notes/${id}/share`, {})
      .pipe(map((r) => r.data));
  }

  unshare(id: number): Observable<void> {
    return this.http.post<void>(`${this.api}/notes/${id}/unshare`, {});
  }
}
