// NoteFlow web app entry point
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Capture beforeinstallprompt early, before Angular bootstraps.
// The PwaService will pick it up from this global when it initializes.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as unknown as Record<string, unknown>)['__pwaInstallPrompt'] = e;
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
