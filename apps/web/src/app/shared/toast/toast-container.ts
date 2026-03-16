import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="fixed bottom-12 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-gray-700">
          <span>{{ toast.message }}</span>
          @if (toast.action) {
            <button
              (click)="toast.action!.callback(); toastSvc.dismiss(toast.id)"
              class="font-semibold text-blue-300 hover:text-blue-200"
            >{{ toast.action!.label }}</button>
          }
          <button
            (click)="toastSvc.dismiss(toast.id)"
            class="ml-1 text-gray-400 hover:text-white"
          >&times;</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected toastSvc = inject(ToastService);
}
