import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, AudioDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  upload(noteId: number, file: File): Observable<AudioDto> {
    const formData = new FormData();
    formData.append('audio', file);

    return this.http
      .post<ApiSuccessResponse<AudioDto>>(`${this.api}/notes/${noteId}/audio`, formData)
      .pipe(map((r) => r.data));
  }
}
