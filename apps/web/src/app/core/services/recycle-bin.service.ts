import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, RecycleBinDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class RecycleBinService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/recycle-bin`;

  getAll(): Observable<RecycleBinDto> {
    return this.http
      .get<ApiSuccessResponse<RecycleBinDto>>(this.base)
      .pipe(map((r) => r.data));
  }

  restoreNotebook(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/restore/notebook/${id}`, {});
  }

  restoreSection(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/restore/section/${id}`, {});
  }

  restoreNote(id: number, sectionId?: number): Observable<void> {
    return this.http.post<void>(`${this.base}/restore/note/${id}`, sectionId ? { sectionId } : {});
  }

  permanentlyDeleteNotebook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/notebook/${id}`);
  }

  permanentlyDeleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/section/${id}`);
  }

  permanentlyDeleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/note/${id}`);
  }

  emptyAll(): Observable<void> {
    return this.http.delete<void>(this.base);
  }
}
