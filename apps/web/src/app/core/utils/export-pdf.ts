import html2pdf from 'html2pdf.js';
import { getStyledCss, getFontFamily } from './export-html';

export function exportNoteAsPdf(title: string, html: string, serif = false): void {
  const fontFamily = getFontFamily(serif);
  const css = getStyledCss(fontFamily);

  // Build a temporary container with styled content
  const container = document.createElement('div');
  container.innerHTML = `
    <style>${css}
      body { margin: 0; }
    </style>
    <h1 class="note-title">${title}</h1>
    ${html}
  `;

  container.style.fontFamily = serif
    ? "'Source Serif 4', Georgia, serif"
    : "'Source Sans 3', 'Segoe UI', sans-serif";
  container.style.color = '#1f2937';
  container.style.lineHeight = '1.6';
  container.style.padding = '0 1rem';

  const sanitized = title.replace(/[<>:"/\\|?*]+/g, '').trim() || 'note';

  // Prevent layout shift: lock body scroll position while html2pdf renders
  // its overlay (which is position:fixed and can cause scrollbar to disappear)
  const scrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';

  html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `${sanitized}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    } as Record<string, unknown>)
    .from(container)
    .save()
    .then(() => {
      // Restore body scroll position
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    });
}
