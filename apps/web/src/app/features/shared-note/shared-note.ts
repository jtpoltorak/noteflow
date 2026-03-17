import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse, SharedNoteDto } from '@noteflow/shared-types';

@Component({
  selector: 'app-shared-note',
  imports: [RouterLink],
  template: `
    <!-- Header bar -->
    <header class="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
      <a routerLink="/" class="text-lg font-bold text-accent-600 dark:text-accent-400">NoteFlow</a>
    </header>

    <main class="mx-auto max-w-3xl px-6 py-8">
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <p class="text-gray-400">Loading shared note...</p>
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <p class="mb-4 text-lg text-gray-500 dark:text-gray-400">This note doesn't exist or is no longer shared.</p>
          <a routerLink="/" class="text-accent-500 hover:text-accent-600 dark:text-accent-400">Go to NoteFlow</a>
        </div>
      } @else if (note()) {
        <h1 class="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ note()!.title }}</h1>
        <div class="noteflow-editor text-gray-800 dark:text-gray-200" [innerHTML]="note()!.content"></div>
        <p class="mt-8 text-xs text-gray-400">
          Last updated {{ formatDate(note()!.updatedAt) }}
        </p>
      }
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 px-6 py-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
      Shared via <a routerLink="/" class="text-accent-500 hover:text-accent-600 dark:text-accent-400">NoteFlow</a>
    </footer>
  `,
  host: {
    class: 'flex min-h-screen flex-col bg-white dark:bg-gray-900',
  },
})
export class SharedNote implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  protected loading = signal(true);
  protected error = signal(false);
  protected note = signal<SharedNoteDto | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.http
      .get<ApiSuccessResponse<SharedNoteDto>>(`${environment.apiUrl}/shared/${token}`)
      .subscribe({
        next: (res) => {
          this.note.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(false);
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
