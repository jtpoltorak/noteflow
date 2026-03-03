import { Component, input, output, afterNextRender, DestroyRef, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-presentation-view',
  imports: [FaIconComponent],
  template: `
    <div class="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900">
      <!-- Top bar -->
      <div class="flex items-center justify-between border-b border-gray-200 px-6 py-3 dark:border-gray-700">
        <h1 class="truncate text-xl font-semibold text-gray-800 dark:text-gray-100">{{ title() }}</h1>
        <button
          (click)="exitPresentation()"
          class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          title="Exit presentation (Esc)"
        >
          <fa-icon [icon]="faXmark" />
          <span>Exit</span>
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto px-6 py-8">
        <div
          class="noteflow-editor presentation-mode mx-auto max-w-4xl text-gray-800 dark:text-gray-100"
          [innerHTML]="content()"
        ></div>
      </div>
    </div>
  `,
})
export class PresentationView {
  title = input.required<string>();
  content = input.required<string>();
  closed = output();

  protected faXmark = faXmark;

  private destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.enterFullscreen();

      const onFullscreenChange = () => {
        if (!document.fullscreenElement) {
          this.closed.emit();
        }
      };

      document.addEventListener('fullscreenchange', onFullscreenChange);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
      });
    });
  }

  protected exitPresentation(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.closed.emit();
    }
  }

  private enterFullscreen(): void {
    document.documentElement.requestFullscreen().catch(() => {
      // Browser may block fullscreen (e.g. not triggered by user gesture).
      // Component still works as an overlay without true fullscreen.
    });
  }
}
