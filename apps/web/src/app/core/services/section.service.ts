import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, SectionDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class SectionService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getByNotebook(notebookId: number): Observable<SectionDto[]> {
    return this.http
      .get<ApiSuccessResponse<SectionDto[]>>(`${this.api}/notebooks/${notebookId}/sections`)
      .pipe(map((r) => r.data));
  }

  create(notebookId: number, title: string): Observable<SectionDto> {
    return this.http
      .post<ApiSuccessResponse<SectionDto>>(`${this.api}/notebooks/${notebookId}/sections`, { title })
      .pipe(map((r) => r.data));
  }

  update(id: number, updates: { title?: string; order?: number; notebookId?: number }): Observable<SectionDto> {
    return this.http
      .put<ApiSuccessResponse<SectionDto>>(`${this.api}/sections/${id}`, updates)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/sections/${id}`);
  }
}
