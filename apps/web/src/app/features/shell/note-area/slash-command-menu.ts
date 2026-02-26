import { Component, computed, effect, ElementRef, HostListener, input, output, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCode, faHeading, faList, faListOl, faMinus, faParagraph, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: IconDefinition;
}

const COMMANDS: SlashCommand[] = [
  { id: 'text',        label: 'Text',          description: 'Plain paragraph',  icon: faParagraph },
  { id: 'heading1',    label: 'Heading 1',     description: 'Large heading',    icon: faHeading },
  { id: 'heading2',    label: 'Heading 2',     description: 'Medium heading',   icon: faHeading },
  { id: 'heading3',    label: 'Heading 3',     description: 'Small heading',    icon: faHeading },
  { id: 'bullet-list', label: 'Bulleted List', description: 'Unordered list',   icon: faList },
  { id: 'number-list', label: 'Numbered List', description: 'Ordered list',     icon: faListOl },
  { id: 'quote',       label: 'Quote',         description: 'Block quote',      icon: faQuoteLeft },
  { id: 'code',        label: 'Code Block',    description: 'Code snippet',     icon: faCode },
  { id: 'divider',     label: 'Divider',       description: 'Horizontal rule',  icon: faMinus },
];

@Component({
  selector: 'app-slash-command-menu',
  imports: [FaIconComponent],
  template: `
    <div
      class="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      [style.top.px]="position().top"
      [style.left.px]="position().left"
    >
      @for (cmd of filteredCommands(); track cmd.id; let i = $index) {
        <button
          class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
          [class.bg-blue-50]="i === selectedIndex()"
          [class.dark:bg-blue-900]="i === selectedIndex()"
          [class.hover:bg-gray-50]="i !== selectedIndex()"
          [class.dark:hover:bg-gray-700]="i !== selectedIndex()"
          (mousedown)="$event.preventDefault()"
          (mouseenter)="selectedIndex.set(i)"
          (click)="selectCommand(cmd)"
        >
          <fa-icon
            [icon]="cmd.icon"
            class="w-5 text-center text-gray-400 dark:text-gray-500"
            size="sm"
          />
          <div>
            <div class="font-medium text-gray-800 dark:text-gray-100">{{ cmd.label }}</div>
            <div class="text-xs text-gray-400 dark:text-gray-500">{{ cmd.description }}</div>
          </div>
        </button>
      }
    </div>
  `,
})
export class SlashCommandMenu {
  filter = input('');
  position = input<{ top: number; left: number }>({ top: 0, left: 0 });
  selected = output<SlashCommand>();
  dismissed = output<void>();

  selectedIndex = signal(0);

  filteredCommands = computed(() => {
    const f = this.filter().toLowerCase();
    if (!f) return COMMANDS;
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(f) ||
        cmd.description.toLowerCase().includes(f),
    );
  });

  constructor() {
    // Reset selection index when filter changes
    effect(() => {
      this.filteredCommands();
      this.selectedIndex.set(0);
    });

    // Auto-dismiss when no results
    effect(() => {
      if (this.filter() && this.filteredCommands().length === 0) {
        this.dismissed.emit();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = (event.target as HTMLElement).closest('app-slash-command-menu');
    if (!el) {
      this.dismissed.emit();
    }
  }

  moveDown(): void {
    const cmds = this.filteredCommands();
    if (cmds.length === 0) return;
    this.selectedIndex.set((this.selectedIndex() + 1) % cmds.length);
  }

  moveUp(): void {
    const cmds = this.filteredCommands();
    if (cmds.length === 0) return;
    this.selectedIndex.set((this.selectedIndex() - 1 + cmds.length) % cmds.length);
  }

  selectCurrent(): void {
    const cmds = this.filteredCommands();
    if (cmds.length > 0) {
      this.selected.emit(cmds[this.selectedIndex()]);
    }
  }

  protected selectCommand(cmd: SlashCommand): void {
    this.selected.emit(cmd);
  }
}
