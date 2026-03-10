import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EditorPreferencesService {
  readonly showToolbar = signal(localStorage.getItem('noteflow-toolbar') !== 'false');
  readonly serifMode = signal(localStorage.getItem('noteflow-font-serif') === 'true');
  readonly showMetadata = signal(localStorage.getItem('noteflow-metadata') === 'true');
  readonly typographyMode = signal(localStorage.getItem('noteflow-typography') === 'true');

  toggleToolbar(): void {
    const next = !this.showToolbar();
    this.showToolbar.set(next);
    localStorage.setItem('noteflow-toolbar', String(next));
  }

  toggleSerif(): void {
    const next = !this.serifMode();
    this.serifMode.set(next);
    localStorage.setItem('noteflow-font-serif', String(next));
  }

  toggleMetadata(): void {
    const next = !this.showMetadata();
    this.showMetadata.set(next);
    localStorage.setItem('noteflow-metadata', String(next));
  }

  toggleTypography(): void {
    const next = !this.typographyMode();
    this.typographyMode.set(next);
    localStorage.setItem('noteflow-typography', String(next));
  }
}
