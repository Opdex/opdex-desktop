import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable, of } from 'rxjs';
import { catchError, delay, map, mergeMap, retryWhen } from 'rxjs/operators';
import { Router } from '@angular/router';
import { OpdexHttpError } from '@models/opdex-http-error';

// Retryable error codes
// Note 404 is excluded intentionally due to checking of wallet balances primarily in liquidity pools
// The check will always be made, likely often will fail and are not *expecting* it to succeed.
const retryableErrors = [400, 401, 429, 500]

@Injectable({ providedIn: 'root' })
export class RestApiService {
  constructor(
    protected _http: HttpClient,
    protected _router: Router
  ) { }

  public get<T>(endpoint: string, options: object = {}): Observable<T> {
    return this._http.get<T>(endpoint, options)
      .pipe(
        retryWhen(err => {
          // Fancy way of retrying, we must throw our own errors after max attempts or RXJS won't catch correctly
          let retries = 0;

          return err.pipe(
            mergeMap((error) => retryableErrors.includes(error.status) ? of(error) : throwError(error)),
            delay((retries + 1) * 1000),
            map(error => {
              if (retries++ === 2) {
                throw error;
              }
              return error;
            })
          )
        }),
        catchError(error => this.handleError(error)));
  }

  public post<T>(endpoint: string, payload: any, options: object = {}): Observable<T> {
    return this._http.post<T>(endpoint, payload, options)
      .pipe(catchError(error => this.handleError(error)));
  }

  public put<T>(endpoint: string, payload: any, options: object = {}): Observable<T> {
    return this._http.put<T>(endpoint, payload, options)
      .pipe(catchError(error => this.handleError(error)));
  }

  public patch<T>(endpoint: string, payload: any, options: object = {}): Observable<T> {
    return this._http.patch<T>(endpoint, payload, options)
      .pipe(catchError(error => this.handleError(error)));
  }

  public delete<T>(endpoint: string, options: object = {}): Observable<T> {
    return this._http.delete<T>(endpoint, options)
      .pipe(catchError(error => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    }

    const errors = [];

    if (!!error?.error) {
      if (!!error.error?.errors && error.error.errors.length > 0) {
        error.error.errors.forEach(error => {
          errors.push(error?.description || error?.message || error.toString());
        })
      }

      // Covers Exception based errors
      if (!!error.error.detail) {
        errors.push(error.error.detail);
      }
    }

    const errorResponse = new OpdexHttpError(errors, error.status);

    console.error(errorResponse);

    // Return an observable with a user-facing error messages
    return throwError(errorResponse);
  }
}


