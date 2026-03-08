import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, UserTemplateDto, CreateUserTemplateDto, UpdateUserTemplateDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(): Observable<UserTemplateDto[]> {
    return this.http
      .get<ApiSuccessResponse<UserTemplateDto[]>>(`${this.api}/templates`)
      .pipe(map((r) => r.data));
  }

  create(data: CreateUserTemplateDto): Observable<UserTemplateDto> {
    return this.http
      .post<ApiSuccessResponse<UserTemplateDto>>(`${this.api}/templates`, data)
      .pipe(map((r) => r.data));
  }

  update(id: number, data: UpdateUserTemplateDto): Observable<UserTemplateDto> {
    return this.http
      .put<ApiSuccessResponse<UserTemplateDto>>(`${this.api}/templates/${id}`, data)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/templates/${id}`);
  }
}
