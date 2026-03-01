import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faStickyNote, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export type ShellMode = 'notes' | 'search';

@Component({
  selector: 'app-nav-rail',
  imports: [FaIconComponent],
  template: `
    <nav class="flex h-full w-12 flex-col items-center gap-1 border-r border-gray-200 bg-gray-100 pt-2 dark:border-gray-700 dark:bg-gray-900">
      <button
        (click)="modeChange.emit('notes')"
        class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        [class]="mode() === 'notes'
          ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
        title="Notes"
      >
        <fa-icon [icon]="faStickyNote" />
      </button>
      <button
        (click)="modeChange.emit('search')"
        class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        [class]="mode() === 'search'
          ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'"
        title="Search"
      >
        <fa-icon [icon]="faMagnifyingGlass" />
      </button>
    </nav>
  `,
})
export class NavRail {
  mode = input.required<ShellMode>();
  modeChange = output<ShellMode>();

  protected faStickyNote = faStickyNote;
  protected faMagnifyingGlass = faMagnifyingGlass;
}
