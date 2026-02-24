import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, UserDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUser = signal<UserDto | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /** Check if we have a valid session on app startup. */
  loadUser(): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .get<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((res) => this.currentUser.set(res.data)));
  }

  register(email: string, password: string): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .post<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/register`, { email, password })
      .pipe(tap((res) => this.currentUser.set(res.data)));
  }

  login(email: string, password: string): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .post<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.currentUser.set(res.data)));
  }

  logout(): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }),
    );
  }
}
