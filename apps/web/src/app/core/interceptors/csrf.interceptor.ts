import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

const CSRF_HEADER = 'X-XSRF-TOKEN';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let csrfToken: string | null = null;

/**
 * Cross-origin CSRF interceptor.
 *
 * Angular's built-in withXsrfConfiguration() only works same-origin because
 * it reads from document.cookie, which can't access cross-origin cookies.
 *
 * This interceptor reads the CSRF token from the X-XSRF-TOKEN response header
 * (exposed via CORS) and caches it in memory. On mutating requests, it attaches
 * the token as an X-XSRF-TOKEN request header.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Attach cached token to mutating requests
  if (MUTATING_METHODS.has(req.method) && csrfToken) {
    req = req.clone({
      setHeaders: { [CSRF_HEADER]: csrfToken },
    });
  }

  return next(req).pipe(
    tap((event) => {
      // Cache the token from any response that includes it
      if (event instanceof HttpResponse) {
        const token = event.headers.get(CSRF_HEADER);
        if (token) {
          csrfToken = token;
        }
      }
    }),
  );
};
