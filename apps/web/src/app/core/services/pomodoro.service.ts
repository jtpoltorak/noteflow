import { Injectable, signal, computed } from '@angular/core';

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

const DURATIONS: Record<PomodoroMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<PomodoroMode, string> = {
  work: 'Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

@Injectable({ providedIn: 'root' })
export class PomodoroService {
  readonly mode = signal<PomodoroMode>('work');
  readonly status = signal<PomodoroStatus>('idle');
  readonly secondsRemaining = signal(DURATIONS.work);
  readonly sessionsCompleted = signal(0);
  readonly isVisible = signal(false);
  readonly isCollapsed = signal(false);

  readonly modeLabel = computed(() => MODE_LABELS[this.mode()]);
  readonly formattedTime = computed(() => {
    const s = this.secondsRemaining();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });
  readonly progress = computed(() => {
    const total = DURATIONS[this.mode()];
    return 1 - this.secondsRemaining() / total;
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private audioCtx: AudioContext | null = null;

  toggle(): void {
    this.isVisible.set(!this.isVisible());
  }

  start(): void {
    if (this.status() === 'running') return;
    this.status.set('running');
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  pause(): void {
    this.status.set('paused');
    this.clearInterval();
  }

  reset(): void {
    this.clearInterval();
    this.status.set('idle');
    this.secondsRemaining.set(DURATIONS[this.mode()]);
  }

  skip(): void {
    this.clearInterval();
    this.advanceSession();
  }

  private tick(): void {
    const remaining = this.secondsRemaining() - 1;
    if (remaining <= 0) {
      this.secondsRemaining.set(0);
      this.clearInterval();
      this.playChime();
      this.advanceSession();
    } else {
      this.secondsRemaining.set(remaining);
    }
  }

  private advanceSession(): void {
    const currentMode = this.mode();
    if (currentMode === 'work') {
      const completed = this.sessionsCompleted() + 1;
      this.sessionsCompleted.set(completed);
      if (completed % 4 === 0) {
        this.setMode('longBreak');
      } else {
        this.setMode('shortBreak');
      }
    } else {
      this.setMode('work');
    }
  }

  private setMode(mode: PomodoroMode): void {
    this.mode.set(mode);
    this.secondsRemaining.set(DURATIONS[mode]);
    this.status.set('idle');
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playChime(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      const ctx = this.audioCtx;

      // Two-tone chime
      const playTone = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.5);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + 0.5);
      };

      playTone(523.25, 0);    // C5
      playTone(659.25, 0.2);  // E5
      playTone(783.99, 0.4);  // G5
    } catch {
      // Audio not available — silently ignore
    }
  }
}
