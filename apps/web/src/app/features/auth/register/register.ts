import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md sm:p-8 dark:bg-gray-800">
        <div class="mb-6 text-center">
          <img src="noteflow-logo.svg" alt="NoteFlow" class="mx-auto h-10 dark:invert" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Create your account</p>
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
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
              minlength="8"
              autocomplete="new-password"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label for="confirmPassword" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              autocomplete="new-password"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Re-enter your password"
            />
          </div>

          @if (passwordMismatch()) {
            <div class="rounded bg-amber-100 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Passwords do not match.</div>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full rounded-md bg-accent-600 px-4 py-2 font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {{ loading() ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <a routerLink="/login" class="font-medium text-accent-600 hover:underline dark:text-accent-400">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  loading = signal(false);
  passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.auth.register(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error?.message || 'Registration failed');
      },
    });
  }
}
