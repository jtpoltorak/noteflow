import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md sm:p-8 dark:bg-gray-800">
        <div class="mb-6 text-center">
          <img src="noteflow-logo.svg" alt="NoteFlow" class="mx-auto h-10 dark:invert" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        @if (error()) {
          <div class="mb-4 rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <a routerLink="/register" class="font-medium text-blue-600 hover:underline dark:text-blue-400">Register</a>
        </p>
      </div>
    </div>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  onSubmit(): void {
    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error?.message || 'Login failed');
      },
    });
  }
}
