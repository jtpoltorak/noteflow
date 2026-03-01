import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, SearchResultDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  search(query: string): Observable<SearchResultDto[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<ApiSuccessResponse<SearchResultDto[]>>(`${this.api}/search`, { params })
      .pipe(map((r) => r.data));
  }
}
