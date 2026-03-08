import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../modal/modal';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings-dialog',
  imports: [Modal, FaIconComponent, FormsModule],
  template: `
    <app-modal [open]="open()" title="Account Settings" (closed)="onClose()">
      <div class="space-y-5">

        <!-- Theme -->
        <section>
          <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Appearance</h3>
          <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
            <span class="text-sm text-gray-600 dark:text-gray-400">Theme</span>
            <button
              (click)="theme.toggle()"
              class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              [class]="theme.darkMode()
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              <fa-icon [icon]="theme.darkMode() ? faSun : faMoon" size="sm" />
              {{ theme.darkMode() ? 'Dark' : 'Light' }}
            </button>
          </div>
        </section>

        <!-- Change password -->
        <section>
          <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Change Password</h3>
          <form (ngSubmit)="onChangePassword()" class="space-y-2">
            <input
              type="password"
              placeholder="Current password"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              [(ngModel)]="newPassword"
              name="newPassword"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            @if (passwordError()) {
              <p class="text-xs text-red-600 dark:text-red-400">{{ passwordError() }}</p>
            }
            @if (passwordSuccess()) {
              <p class="text-xs text-green-600 dark:text-green-400">{{ passwordSuccess() }}</p>
            }
            <button
              type="submit"
              [disabled]="changingPassword()"
              class="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ changingPassword() ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </section>

        <!-- Sign out -->
        <section class="border-t border-gray-200 pt-4 dark:border-gray-600">
          <button
            (click)="onLogout()"
            class="w-full rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            Sign out
          </button>
        </section>

      </div>
    </app-modal>
  `,
})
export class SettingsDialog {
  open = input(false);
  closed = output();

  protected theme = inject(ThemeService);
  private auth = inject(AuthService);

  protected faSun = faSun;
  protected faMoon = faMoon;

  // Change password form
  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';
  protected passwordError = signal('');
  protected passwordSuccess = signal('');
  protected changingPassword = signal(false);

  protected onChangePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (!this.currentPassword) {
      this.passwordError.set('Current password is required');
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('New password must be at least 8 characters');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('New passwords do not match');
      return;
    }

    this.changingPassword.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordSuccess.set('Password changed successfully');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.changingPassword.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error?.message ?? 'Failed to change password';
        this.passwordError.set(msg);
        this.changingPassword.set(false);
      },
    });
  }

  protected onLogout(): void {
    this.auth.logout().subscribe();
  }

  protected onClose(): void {
    this.resetForm();
    this.closed.emit();
  }

  private resetForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError.set('');
    this.passwordSuccess.set('');
  }
}
