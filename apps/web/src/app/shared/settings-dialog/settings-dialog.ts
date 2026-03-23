import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon, faFileExport, faFileArrowDown, faCircleCheck, faTriangleExclamation, faSliders, faUserGear } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../modal/modal';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import type { ColorTheme } from '@noteflow/shared-types';
import { EditorPreferencesService } from '../../core/services/editor-preferences.service';
import { PwaService } from '../../core/services/pwa.service';
import { environment } from '../../../environments/environment';

type SettingsTab = 'general' | 'account';

@Component({
  selector: 'app-settings-dialog',
  imports: [Modal, FaIconComponent, FormsModule],
  template: `
    <app-modal [open]="open()" title="Settings" (closed)="onClose()">
      <!-- Tab bar -->
      <div class="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          (click)="tab.set('general')"
          class="flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          [class]="tab() === 'general'
            ? 'border-accent-500 text-accent-600 dark:text-accent-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
        >
          <fa-icon [icon]="faSliders" size="sm" />
          General
        </button>
        <button
          (click)="tab.set('account')"
          class="flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors"
          [class]="tab() === 'account'
            ? 'border-accent-500 text-accent-600 dark:text-accent-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
        >
          <fa-icon [icon]="faUserGear" size="sm" />
          Account
        </button>
      </div>

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- GENERAL TAB                                             -->
      <!-- ════════════════════════════════════════════════════════ -->
      @if (tab() === 'general') {
        <div class="space-y-5">

          <!-- Appearance -->
          <section>
            <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Appearance</h3>
            <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-400">Light / Dark</span>
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
            <p class="mb-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">Color Theme</p>
            <div class="grid grid-cols-4 gap-1.5">
              @for (t of colorThemes; track t.id) {
                <button
                  (click)="theme.setTheme(t.id)"
                  [title]="t.label"
                  class="flex flex-col items-center gap-1 rounded-lg border-2 px-1 py-1.5 text-[10px] font-medium transition-all hover:scale-[1.03]"
                  [class]="theme.colorTheme() === t.id
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'"
                >
                  <div class="flex h-5 w-full overflow-hidden rounded">
                    <span class="flex-1" [style.background-color]="t.light"></span>
                    <span class="flex-1" [style.background-color]="t.dark"></span>
                    <span class="w-2.5" [style.background-color]="t.accent"></span>
                  </div>
                  <span class="text-gray-600 dark:text-gray-400">{{ t.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Install App -->
          @if (pwa.canInstall()) {
            <section>
              <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Install App</h3>
              <div class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
                <p class="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  Install NoteFlow on your device for quick access and a native app experience.
                </p>
                <button
                  (click)="pwa.promptInstall()"
                  class="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
                >
                  <fa-icon [icon]="faFileArrowDown" size="sm" />
                  Install NoteFlow
                </button>
              </div>
            </section>
          }
          @if (pwa.isInstalled()) {
            <section>
              <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">App Status</h3>
              <div class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
                <p class="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <fa-icon [icon]="faCircleCheck" size="sm" />
                  NoteFlow is installed on this device.
                </p>
              </div>
            </section>
          }

          <!-- Storage -->
          <section>
            <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Storage</h3>
            <div class="space-y-1">
              <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
                <div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Delete items immediately</span>
                  <p class="text-[11px] text-gray-400 dark:text-gray-500">Skip the Recycle Bin and permanently delete items right away.</p>
                </div>
                <button
                  (click)="toggleSkipRecycleBin()"
                  class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                  [class]="skipRecycleBin() ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span
                    class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                    [class.translate-x-4]="skipRecycleBin()"
                  ></span>
                </button>
              </div>
              <p class="px-1 text-[11px] text-gray-400 dark:text-gray-500">
                Items in the Recycle Bin are automatically purged after 30 days.
              </p>
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
                  [class]="editorPrefs.showToolbar() ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-600'"
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
                  [class]="editorPrefs.serifMode() ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-600'"
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
                  [class]="editorPrefs.showMetadata() ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span
                    class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                    [class.translate-x-4]="editorPrefs.showMetadata()"
                  ></span>
                </button>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
                <div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Smart Typography</span>
                  <p class="text-[11px] text-gray-400 dark:text-gray-500">Auto-convert characters like -&gt; to arrows, (c) to &copy;, etc.</p>
                </div>
                <button
                  (click)="editorPrefs.toggleTypography()"
                  class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                  [class]="editorPrefs.typographyMode() ? 'bg-accent-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span
                    class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                    [class.translate-x-4]="editorPrefs.typographyMode()"
                  ></span>
                </button>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-400">Font Size</span>
                <select
                  [value]="editorPrefs.fontSize()"
                  (change)="editorPrefs.setFontSize($any($event.target).value)"
                  class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="default">Default</option>
                  <option value="large">Large</option>
                  <option value="xl">Extra Large</option>
                  <option value="xxl">Extra Extra Large</option>
                </select>
              </div>
            </div>
          </section>

        </div>
      }

      <!-- ════════════════════════════════════════════════════════ -->
      <!-- ACCOUNT TAB                                             -->
      <!-- ════════════════════════════════════════════════════════ -->
      @if (tab() === 'account') {
        <div class="space-y-5">

          <!-- Change password -->
          <section>
            <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Change Password</h3>
            <form (ngSubmit)="onChangePassword()" class="space-y-2">
              <input
                type="password"
                placeholder="Current password"
                [(ngModel)]="currentPassword"
                name="currentPassword"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                [(ngModel)]="newPassword"
                name="newPassword"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
                class="rounded-md bg-accent-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
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

          <!-- Danger Zone -->
          <section class="rounded-lg border-2 border-red-200 dark:border-red-800">
            <div class="flex items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
              <fa-icon [icon]="faTriangleExclamation" class="text-red-500" size="sm" />
              <h3 class="text-sm font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
            </div>
            <div class="space-y-3 px-3 py-3">

              <div class="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                <p class="mb-1.5">
                  <strong>Closing your account is permanent.</strong> After the 7-day grace period,
                  all your data will be irreversibly deleted — including your notebooks, sections,
                  notes, tags, images, and templates.
                </p>
                <p class="mb-1.5">
                  We recommend <strong>exporting your data first</strong> using the options above
                  so you have a backup in case you ever want to reference your notes.
                </p>
                <p>
                  During the 7-day grace period you can still log in and cancel the closure to
                  keep your account.
                </p>
              </div>

              @if (closurePending()) {
                <!-- Account is pending closure -->
                <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/20">
                  <p class="text-sm text-amber-800 dark:text-amber-300">
                    Your account is scheduled for permanent deletion on
                    <strong>{{ closureDeletionDate() }}</strong>.
                  </p>
                </div>
                <button
                  (mousedown)="onReactivate()"
                  [disabled]="reactivating()"
                  class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {{ reactivating() ? 'Reactivating...' : 'Cancel Closure & Keep My Account' }}
                </button>
              } @else {
                <!-- Close account form -->
                @if (!showClosureConfirm()) {
                  <button
                    (click)="showClosureConfirm.set(true)"
                    class="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Close My Account...
                  </button>
                } @else {
                  <div class="space-y-2">
                    <p class="text-xs font-medium text-red-600 dark:text-red-400">Enter your password to confirm:</p>
                    <input
                      type="password"
                      placeholder="Your password"
                      [(ngModel)]="closurePassword"
                      name="closurePassword"
                      (keydown.enter)="onRequestClosure()"
                      class="w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-400 dark:border-red-700 dark:bg-gray-700 dark:text-gray-100"
                    />
                    @if (closureError()) {
                      <p class="text-xs text-red-600 dark:text-red-400">{{ closureError() }}</p>
                    }
                    <div class="flex gap-2">
                      <button
                        (click)="showClosureConfirm.set(false); closurePassword = ''; closureError.set('')"
                        class="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        (click)="onRequestClosure()"
                        [disabled]="closureLoading()"
                        class="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {{ closureLoading() ? 'Closing...' : 'Permanently Close Account' }}
                      </button>
                    </div>
                  </div>
                }
              }
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
      }
    </app-modal>
  `,
})
export class SettingsDialog {
  open = input(false);
  closed = output();

  protected theme = inject(ThemeService);
  protected editorPrefs = inject(EditorPreferencesService);
  protected pwa = inject(PwaService);
  private auth = inject(AuthService);

  protected faSun = faSun;
  protected faMoon = faMoon;
  protected faFileExport = faFileExport;
  protected faFileArrowDown = faFileArrowDown;
  protected faCircleCheck = faCircleCheck;
  protected faTriangleExclamation = faTriangleExclamation;
  protected faSliders = faSliders;
  protected faUserGear = faUserGear;

  protected tab = signal<SettingsTab>('general');

  protected colorThemes: { id: ColorTheme; label: string; light: string; dark: string; accent: string }[] = [
    { id: 'default',     label: 'Default',     light: '#f9fafb', dark: '#111827', accent: '#3b82f6' },
    { id: 'nord',        label: 'Nord',        light: '#e5e9f0', dark: '#2e3440', accent: '#5e81ac' },
    { id: 'solarized',   label: 'Solarized',   light: '#fdf6e3', dark: '#073642', accent: '#2aa198' },
    { id: 'dracula',     label: 'Dracula',     light: '#f8f8f2', dark: '#282a36', accent: '#ff79c6' },
    { id: 'catppuccin',  label: 'Catppuccin',  light: '#ede5ed', dark: '#1e1e2e', accent: '#cba6f7' },
    { id: 'rose-pine',   label: 'Rosé Pine',   light: '#faf4ed', dark: '#191724', accent: '#f6c177' },
    { id: 'tokyo-night', label: 'Tokyo Night', light: '#e0e0ed', dark: '#1a1b26', accent: '#7aa2f7' },
    { id: 'gruvbox',     label: 'Gruvbox',     light: '#fbf1c7', dark: '#282828', accent: '#fe8019' },
    { id: 'everforest',  label: 'Everforest',  light: '#f3ead3', dark: '#272e27', accent: '#a7c080' },
    { id: 'one-dark',    label: 'One Dark',    light: '#dcdfe4', dark: '#282c34', accent: '#56b6c2' },
    { id: 'moonlight',   label: 'Moonlight',   light: '#dfe1f0', dark: '#1b1d2b', accent: '#82aaff' },
    { id: 'kanagawa',    label: 'Kanagawa',    light: '#e0d9b6', dark: '#1f1f28', accent: '#7e9cd8' },
  ];

  protected exportJsonUrl = `${environment.apiUrl}/auth/export/json`;
  protected exportMarkdownUrl = `${environment.apiUrl}/auth/export/markdown`;

  // Change password form
  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';
  protected passwordError = signal('');
  protected passwordSuccess = signal('');
  protected changingPassword = signal(false);

  // Account closure
  protected closurePassword = '';
  protected closureError = signal('');
  protected closureLoading = signal(false);
  protected showClosureConfirm = signal(false);
  protected reactivating = signal(false);

  protected skipRecycleBin = computed(() => this.auth.user()?.skipRecycleBin ?? false);

  protected closurePending = computed(() => !!this.auth.user()?.deleteRequestedAt);
  protected closureDeletionDate = computed(() => {
    const deleteRequestedAt = this.auth.user()?.deleteRequestedAt;
    if (!deleteRequestedAt) return '';
    const d = new Date(deleteRequestedAt);
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  });

  protected toggleSkipRecycleBin(): void {
    const next = !this.skipRecycleBin();
    this.auth.updatePreferences({ skipRecycleBin: next }).subscribe();
  }

  protected onRequestClosure(): void {
    this.closureError.set('');
    if (!this.closurePassword) {
      this.closureError.set('Password is required');
      return;
    }
    this.closureLoading.set(true);
    this.auth.closeAccount(this.closurePassword).subscribe({
      next: () => {
        this.closureLoading.set(false);
        this.closurePassword = '';
        this.showClosureConfirm.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error?.message ?? 'Failed to close account';
        this.closureError.set(msg);
        this.closureLoading.set(false);
      },
    });
  }

  protected onReactivate(): void {
    this.reactivating.set(true);
    this.auth.reactivateAccount().subscribe({
      next: () => this.reactivating.set(false),
      error: () => this.reactivating.set(false),
    });
  }

  protected onChangePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (!this.currentPassword) {
      this.passwordError.set('Current password is required');
      return;
    }
    if (this.newPassword.length < 8 || !/[a-z]/.test(this.newPassword) || !/[A-Z]/.test(this.newPassword) || !/[0-9]/.test(this.newPassword)) {
      this.passwordError.set('Password must be at least 8 characters with one uppercase, one lowercase, and one number');
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
    this.closurePassword = '';
    this.closureError.set('');
    this.showClosureConfirm.set(false);
  }
}
