import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, NotebookDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class NotebookService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notebooks`;

  getAll(): Observable<NotebookDto[]> {
    return this.http.get<ApiSuccessResponse<NotebookDto[]>>(this.base).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<NotebookDto> {
    return this.http.get<ApiSuccessResponse<NotebookDto>>(`${this.base}/${id}`).pipe(map((r) => r.data));
  }

  create(title: string): Observable<NotebookDto> {
    return this.http.post<ApiSuccessResponse<NotebookDto>>(this.base, { title }).pipe(map((r) => r.data));
  }

  update(id: number, title: string): Observable<NotebookDto> {
    return this.http.put<ApiSuccessResponse<NotebookDto>>(`${this.base}/${id}`, { title }).pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
