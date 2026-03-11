import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaService {
  /** Whether the app can be installed (browser fired beforeinstallprompt). */
  readonly canInstall = signal(false);

  /** Whether the app is already running as an installed PWA. */
  readonly isInstalled = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    // Detect if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    this.isInstalled.set(isStandalone);

    // Check if beforeinstallprompt was captured before Angular bootstrapped (see main.ts)
    const earlyPrompt = (window as unknown as Record<string, unknown>)['__pwaInstallPrompt'] as BeforeInstallPromptEvent | undefined;
    if (earlyPrompt) {
      this.deferredPrompt = earlyPrompt;
      this.canInstall.set(true);
      delete (window as unknown as Record<string, unknown>)['__pwaInstallPrompt'];
    }

    // Listen for future install prompt events
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    // Detect when the app is installed
    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.deferredPrompt = null;
    });
  }

  /** Trigger the browser's install prompt. */
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      this.canInstall.set(false);
      this.isInstalled.set(true);
    }
    this.deferredPrompt = null;
  }
}
