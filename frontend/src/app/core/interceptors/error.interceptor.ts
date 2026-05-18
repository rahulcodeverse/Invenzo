import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../services/auth.service';

let sessionExpiredMessageShown = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const message = inject(NzMessageService);
  const authService = inject(AuthService);

  return next(req).pipe(
    tap(() => {
      if (req.url.includes('/auth/login')) {
        sessionExpiredMessageShown = false;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';
      const isAuthRoute = req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password');

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        if (error.status === 401) {
          if (req.url.includes('/auth/login')) {
            message.error(error.error?.message || 'Invalid email or password.');
            return throwError(() => error);
          }

          authService.clearSession();

          if (!isAuthRoute && router.url !== '/auth/login' && !sessionExpiredMessageShown) {
            sessionExpiredMessageShown = true;
            message.error('Your session expired. Please login again.');
            router.navigate(['/auth/login']);
          } else if (!isAuthRoute && router.url !== '/auth/login') {
            router.navigate(['/auth/login']);
          }

          return throwError(() => error);
        } else if (error.status === 403) {
          errorMessage = 'Access forbidden';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }

      message.error(errorMessage);
      return throwError(() => error);
    })
  );
};

