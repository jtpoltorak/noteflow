import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, UserDto } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);

  readonly darkMode = signal(false);

  constructor() {
    // Use system preference as initial default (before server pref loads)
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  /** Load server-side preference (called after login/register/loadUser). */
  init(darkMode: boolean): void {
    this.darkMode.set(darkMode);
    this.applyClass(darkMode);
  }

  /** Toggle dark mode and persist to server. */
  toggle(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    this.applyClass(next);
    this.http
      .put<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/preferences`, { darkMode: next })
      .subscribe();
  }

  private applyClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
