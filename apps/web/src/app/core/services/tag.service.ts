import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, TagDto, TagWithCountDto, TaggedNoteDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<TagWithCountDto[]> {
    return this.http
      .get<ApiSuccessResponse<TagWithCountDto[]>>(`${this.api}/tags`)
      .pipe(map((r) => r.data));
  }

  getNotesByTag(tagId: number): Observable<TaggedNoteDto[]> {
    return this.http
      .get<ApiSuccessResponse<TaggedNoteDto[]>>(`${this.api}/tags/${tagId}/notes`)
      .pipe(map((r) => r.data));
  }

  getTagsForNote(noteId: number): Observable<TagDto[]> {
    return this.http
      .get<ApiSuccessResponse<TagDto[]>>(`${this.api}/notes/${noteId}/tags`)
      .pipe(map((r) => r.data));
  }

  create(name: string): Observable<TagDto> {
    return this.http
      .post<ApiSuccessResponse<TagDto>>(`${this.api}/tags`, { name })
      .pipe(map((r) => r.data));
  }

  rename(id: number, name: string): Observable<TagDto> {
    return this.http
      .put<ApiSuccessResponse<TagDto>>(`${this.api}/tags/${id}`, { name })
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/tags/${id}`);
  }

  addTagToNote(noteId: number, name: string): Observable<TagDto> {
    return this.http
      .post<ApiSuccessResponse<TagDto>>(`${this.api}/notes/${noteId}/tags`, { name })
      .pipe(map((r) => r.data));
  }

  removeTagFromNote(noteId: number, tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/notes/${noteId}/tags/${tagId}`);
  }
}
