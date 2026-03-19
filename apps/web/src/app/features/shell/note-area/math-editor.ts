import { Component, ElementRef, OnInit, effect, input, output, signal, viewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';

export interface MathEditorResult {
  latex: string;
}

@Component({
  selector: 'app-math-editor',
  imports: [FaIconComponent],
  template: `
    <div
      class="fixed z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
      [style.top.px]="position().top"
      [style.left.px]="position().left"
      (mousedown)="$event.preventDefault()"
    >
      <div class="border-b border-gray-100 px-3 py-1.5 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Math Equation</span>
      </div>
      <div class="p-2">
        <input
          #latexInput
          type="text"
          [value]="latex()"
          (input)="latex.set($any($event.target).value)"
          (keydown)="onKeyDown($event)"
          class="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-sm text-gray-800 placeholder-gray-400 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          placeholder="E = mc^2"
        />
        <div class="mt-1.5 flex items-center justify-between">
          <button
            (click)="onDelete()"
            class="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Remove equation"
          >
            <fa-icon [icon]="faTrash" size="xs" />
          </button>
          <div class="flex gap-1.5">
            <button
              (click)="dismissed.emit()"
              class="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >Cancel</button>
            <button
              (click)="confirm()"
              class="rounded bg-accent-500 px-2 py-1 text-xs text-white hover:bg-accent-600"
            >
              <fa-icon [icon]="faCheck" size="xs" class="mr-0.5" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MathEditor implements OnInit {
  position = input<{ top: number; left: number }>({ top: 0, left: 0 });
  initialLatex = input('');
  selected = output<MathEditorResult>();
  deleted = output<void>();
  dismissed = output<void>();

  latex = signal('');
  protected faCheck = faCheck;
  protected faTrash = faTrash;

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('latexInput');

  ngOnInit(): void {
    this.latex.set(this.initialLatex());
  }

  constructor() {
    effect(() => {
      const el = this.inputEl()?.nativeElement;
      if (el) {
        setTimeout(() => {
          el.focus();
          el.select();
        });
      }
    });
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.dismissed.emit();
    }
  }

  protected confirm(): void {
    const value = this.latex().trim();
    if (value) {
      this.selected.emit({ latex: value });
    } else {
      this.dismissed.emit();
    }
  }

  protected onDelete(): void {
    this.deleted.emit();
  }
}
