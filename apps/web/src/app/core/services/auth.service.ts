import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ThemeService } from './theme.service';
import type { ApiSuccessResponse, UserDto, AccountClosureStatusDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private theme = inject(ThemeService);

  private currentUser = signal<UserDto | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /** Check if we have a valid session on app startup. */
  loadUser(): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .get<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((res) => {
        this.currentUser.set(res.data);
        this.theme.init(res.data.darkMode, res.data.accentTheme);
      }));
  }

  register(email: string, password: string): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .post<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/register`, { email, password })
      .pipe(tap((res) => {
        this.currentUser.set(res.data);
        this.theme.init(res.data.darkMode, res.data.accentTheme);
      }));
  }

  login(email: string, password: string): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .post<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => {
        this.currentUser.set(res.data);
        this.theme.init(res.data.darkMode, res.data.accentTheme);
      }));
  }

  logout(): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiSuccessResponse<null>> {
    return this.http.put<ApiSuccessResponse<null>>(
      `${environment.apiUrl}/auth/password`,
      { currentPassword, newPassword }
    );
  }

  closeAccount(password: string): Observable<ApiSuccessResponse<AccountClosureStatusDto>> {
    return this.http
      .post<ApiSuccessResponse<AccountClosureStatusDto>>(
        `${environment.apiUrl}/auth/close-account`,
        { password },
      )
      .pipe(
        tap((res) => {
          const user = this.currentUser();
          if (user) {
            this.currentUser.set({ ...user, deleteRequestedAt: res.data.deleteRequestedAt });
          }
        }),
      );
  }

  reactivateAccount(): Observable<ApiSuccessResponse<null>> {
    return this.http
      .post<ApiSuccessResponse<null>>(`${environment.apiUrl}/auth/reactivate-account`, {})
      .pipe(
        tap(() => {
          const user = this.currentUser();
          if (user) {
            this.currentUser.set({ ...user, deleteRequestedAt: null });
          }
        }),
      );
  }

  /** Update user preferences and refresh local state. */
  updatePreferences(prefs: { darkMode?: boolean; skipRecycleBin?: boolean }): Observable<ApiSuccessResponse<UserDto>> {
    return this.http
      .put<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/preferences`, prefs)
      .pipe(tap((res) => this.currentUser.set(res.data)));
  }

  /** Clear local state and redirect to login without making an HTTP call. */
  clearAndRedirect(): void {
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
