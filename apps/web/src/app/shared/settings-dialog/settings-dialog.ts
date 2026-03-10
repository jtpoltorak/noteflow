import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon, faFileExport } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../modal/modal';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { EditorPreferencesService } from '../../core/services/editor-preferences.service';
import { environment } from '../../../environments/environment';

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

        <!-- Editor -->
        <section>
          <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Editor</h3>
          <div class="space-y-1">
            <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-400">Show Formatting Toolbar</span>
              <button
                (click)="editorPrefs.toggleToolbar()"
                class="relative h-5 w-9 rounded-full transition-colors"
                [class]="editorPrefs.showToolbar() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                  [class.translate-x-4]="editorPrefs.showToolbar()"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-400">Serif Font</span>
              <button
                (click)="editorPrefs.toggleSerif()"
                class="relative h-5 w-9 rounded-full transition-colors"
                [class]="editorPrefs.serifMode() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                  [class.translate-x-4]="editorPrefs.serifMode()"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-400">Show Note Metadata</span>
              <button
                (click)="editorPrefs.toggleMetadata()"
                class="relative h-5 w-9 rounded-full transition-colors"
                [class]="editorPrefs.showMetadata() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                  [class.translate-x-4]="editorPrefs.showMetadata()"
                ></span>
              </button>
            </div>
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

        <!-- Export data -->
        <section>
          <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Export My Data</h3>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Download all your notebooks, sections, notes, and tags.
          </p>
          <div class="flex gap-2">
            <a
              [href]="exportJsonUrl"
              class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <fa-icon [icon]="faFileExport" size="sm" />
              JSON
            </a>
            <a
              [href]="exportMarkdownUrl"
              class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <fa-icon [icon]="faFileExport" size="sm" />
              Markdown (ZIP)
            </a>
          </div>
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
  protected editorPrefs = inject(EditorPreferencesService);
  private auth = inject(AuthService);

  protected faSun = faSun;
  protected faMoon = faMoon;
  protected faFileExport = faFileExport;

  protected exportJsonUrl = `${environment.apiUrl}/auth/export/json`;
  protected exportMarkdownUrl = `${environment.apiUrl}/auth/export/markdown`;

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
