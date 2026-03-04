import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, SearchResultDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  search(query: string, includeArchived: boolean = false): Observable<SearchResultDto[]> {
    let params = new HttpParams().set('q', query);
    if (includeArchived) {
      params = params.set('includeArchived', 'true');
    }
    return this.http
      .get<ApiSuccessResponse<SearchResultDto[]>>(`${this.api}/search`, { params })
      .pipe(map((r) => r.data));
  }
}
