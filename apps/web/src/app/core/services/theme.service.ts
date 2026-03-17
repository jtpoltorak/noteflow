import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, UserDto, ColorTheme } from '@noteflow/shared-types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);

  readonly darkMode = signal(false);
  readonly colorTheme = signal<ColorTheme>('default');

  constructor() {
    // Use system preference as initial default (before server pref loads)
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  /** Load server-side preferences (called after login/register/loadUser). */
  init(darkMode: boolean, colorTheme?: ColorTheme): void {
    this.darkMode.set(darkMode);
    this.applyDarkClass(darkMode);
    if (colorTheme) {
      this.colorTheme.set(colorTheme);
      this.applyTheme(colorTheme);
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

  /** Set color theme and persist to server. */
  setTheme(theme: ColorTheme): void {
    this.colorTheme.set(theme);
    this.applyTheme(theme);
    this.http
      .put<ApiSuccessResponse<UserDto>>(`${environment.apiUrl}/auth/preferences`, { colorTheme: theme })
      .subscribe();
  }

  private applyDarkClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyTheme(theme: ColorTheme): void {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
