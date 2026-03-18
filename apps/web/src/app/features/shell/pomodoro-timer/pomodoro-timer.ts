import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlay, faPause, faRotateRight, faForwardStep, faChevronDown, faChevronUp, faXmark } from '@fortawesome/free-solid-svg-icons';
import { PomodoroService } from '../../../core/services/pomodoro.service';

@Component({
  selector: 'app-pomodoro-timer',
  imports: [FaIconComponent],
  host: { class: 'fixed bottom-12 right-4 z-40' },
  template: `
    @if (pomo.isCollapsed()) {
      <!-- Collapsed pill -->
      <button
        (click)="pomo.isCollapsed.set(false)"
        class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        title="Expand timer"
      >
        <span class="text-sm">&#x1F345;</span>
        <span class="font-mono text-sm font-semibold"
          [class]="pomo.status() === 'running' ? modeTextClass() : 'text-gray-600 dark:text-gray-300'"
        >{{ pomo.formattedTime() }}</span>
        <fa-icon [icon]="faChevronUp" size="xs" class="text-gray-400" />
      </button>
    } @else {
      <!-- Expanded widget -->
      <div class="w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-700">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pomodoro Timer</span>
          <div class="flex items-center gap-1">
            <button
              (click)="pomo.isCollapsed.set(true)"
              class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Collapse"
            >
              <fa-icon [icon]="faChevronDown" size="xs" />
            </button>
            <button
              (click)="pomo.toggle()"
              class="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Close"
            >
              <fa-icon [icon]="faXmark" size="xs" />
            </button>
          </div>
        </div>

        <!-- Timer display -->
        <div class="flex flex-col items-center px-4 pb-3 pt-4">
          <!-- Progress ring -->
          <div class="relative mb-3">
            <svg class="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke-width="6"
                class="stroke-gray-100 dark:stroke-gray-700" />
              <circle cx="60" cy="60" r="52" fill="none" stroke-width="6"
                stroke-linecap="round"
                [class]="modeStrokeClass()"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="circumference - (pomo.progress() * circumference)" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="font-mono text-2xl font-bold text-gray-800 dark:text-gray-100">
                {{ pomo.formattedTime() }}
              </span>
              <span class="text-xs font-medium" [class]="modeTextClass()">
                {{ pomo.modeLabel() }}
              </span>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-2">
            @if (pomo.status() === 'running') {
              <button
                (click)="pomo.pause()"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                title="Pause"
              >
                <fa-icon [icon]="faPause" size="sm" />
              </button>
            } @else {
              <button
                (click)="pomo.start()"
                class="flex h-9 w-9 items-center justify-center rounded-full text-white"
                [class]="modeButtonClass()"
                title="Start"
              >
                <fa-icon [icon]="faPlay" size="sm" />
              </button>
            }
            <button
              (click)="pomo.reset()"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              title="Reset"
            >
              <fa-icon [icon]="faRotateRight" size="sm" />
            </button>
            <button
              (click)="pomo.skip()"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              title="Skip to next"
            >
              <fa-icon [icon]="faForwardStep" size="sm" />
            </button>
          </div>

          <!-- Session counter -->
          <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Sessions: {{ pomo.sessionsCompleted() }}
          </div>
        </div>
      </div>
    }
  `,
})
export class PomodoroTimer {
  protected pomo = inject(PomodoroService);

  protected faPlay = faPlay;
  protected faPause = faPause;
  protected faRotateRight = faRotateRight;
  protected faForwardStep = faForwardStep;
  protected faChevronDown = faChevronDown;
  protected faChevronUp = faChevronUp;
  protected faXmark = faXmark;

  protected circumference = 2 * Math.PI * 52;

  protected modeStrokeClass(): string {
    switch (this.pomo.mode()) {
      case 'work': return 'stroke-red-700';
      case 'shortBreak': return 'stroke-green-700';
      case 'longBreak': return 'stroke-blue-700';
    }
  }

  protected modeTextClass(): string {
    switch (this.pomo.mode()) {
      case 'work': return 'text-red-700 dark:text-red-400';
      case 'shortBreak': return 'text-green-700 dark:text-green-400';
      case 'longBreak': return 'text-blue-700 dark:text-blue-400';
    }
  }

  protected modeButtonClass(): string {
    switch (this.pomo.mode()) {
      case 'work': return 'bg-red-700 hover:bg-red-800';
      case 'shortBreak': return 'bg-green-700 hover:bg-green-800';
      case 'longBreak': return 'bg-blue-700 hover:bg-blue-800';
    }
  }
}
