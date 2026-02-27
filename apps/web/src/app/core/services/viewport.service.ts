import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';

@Injectable({ providedIn: 'root' })
export class ViewportService implements OnDestroy {
  private lgQuery = window.matchMedia('(min-width: 1024px)');
  private smQuery = window.matchMedia('(min-width: 640px)');

  /** Current viewport category */
  readonly viewport = signal<ViewportSize>(this.evaluate());

  /** True when viewport >= 1024px (Tailwind lg) */
  readonly isDesktop = computed(() => this.viewport() === 'desktop');

  /** True when viewport < 640px */
  readonly isMobile = computed(() => this.viewport() === 'mobile');

  /** True when viewport < 1024px (mobile OR tablet) */
  readonly isCompact = computed(() => this.viewport() !== 'desktop');

  private lgListener = (e: MediaQueryListEvent) => this.viewport.set(this.evaluate());
  private smListener = (e: MediaQueryListEvent) => this.viewport.set(this.evaluate());

  constructor() {
    this.lgQuery.addEventListener('change', this.lgListener);
    this.smQuery.addEventListener('change', this.smListener);
  }

  ngOnDestroy(): void {
    this.lgQuery.removeEventListener('change', this.lgListener);
    this.smQuery.removeEventListener('change', this.smListener);
  }

  private evaluate(): ViewportSize {
    if (this.lgQuery.matches) return 'desktop';
    if (this.smQuery.matches) return 'tablet';
    return 'mobile';
  }
}
