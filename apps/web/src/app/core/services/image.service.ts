import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, ImageDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  upload(noteId: number, file: File): Observable<ImageDto> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<ApiSuccessResponse<ImageDto>>(`${this.api}/notes/${noteId}/images`, formData)
      .pipe(map((r) => r.data));
  }
}
