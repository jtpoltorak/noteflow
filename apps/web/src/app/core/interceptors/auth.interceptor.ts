import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError, Subject, Observable, filter, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const AUTH_SKIP_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me', '/shared/'];

let isRefreshing = false;
let refreshResult$ = new Subject<boolean>();

function shouldSkipRefresh(url: string): boolean {
  return AUTH_SKIP_URLS.some((skip) => url.includes(skip));
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const http = inject(HttpClient);
  const authService = inject(AuthService);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || shouldSkipRefresh(req.url)) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Another request is already refreshing — wait for its result
        return refreshResult$.pipe(
          filter((success) => success !== undefined),
          take(1),
          switchMap((success) => {
            if (success) {
              return next(req.clone({ withCredentials: true }));
            }
            return throwError(() => error);
          }),
        );
      }

      isRefreshing = true;
      refreshResult$ = new Subject<boolean>();

      return new Observable<ReturnType<HttpHandlerFn> extends Observable<infer T> ? T : never>((subscriber) => {
        http
          .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
          .subscribe({
            next: () => {
              isRefreshing = false;
              refreshResult$.next(true);
              refreshResult$.complete();

              // Retry the original request
              next(req.clone({ withCredentials: true })).subscribe(subscriber);
            },
            error: () => {
              isRefreshing = false;
              refreshResult$.next(false);
              refreshResult$.complete();

              authService.clearAndRedirect();
              subscriber.error(error);
            },
          });
      });
    }),
  );
};
