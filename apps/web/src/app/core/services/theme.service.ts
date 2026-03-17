import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, UserDto, AccentTheme } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);

  readonly darkMode = signal(false);
  readonly accentTheme = signal<AccentTheme>('ocean');

  constructor() {
    // Use system preference as initial default (before server pref loads)
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  /** Load server-side preference (called after login/register/loadUser). */
  init(darkMode: boolean, accentTheme?: AccentTheme): void {
    this.darkMode.set(darkMode);
    this.applyDarkClass(darkMode);
    if (accentTheme) {
      this.accentTheme.set(accentTheme);
      this.applyAccent(accentTheme);
    }
  }

  /** Toggle dark mode and persist to server. */
  toggle(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    this.applyDarkClass(next);
    this.http
      .put<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/preferences`, { darkMode: next })
      .subscribe();
  }

  /** Set accent theme and persist to server. */
  setAccent(theme: AccentTheme): void {
    this.accentTheme.set(theme);
    this.applyAccent(theme);
    this.http
      .put<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/preferences`, { accentTheme: theme })
      .subscribe();
  }

  private applyDarkClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyAccent(theme: AccentTheme): void {
    if (theme === 'ocean') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', theme);
    }
  }
}
