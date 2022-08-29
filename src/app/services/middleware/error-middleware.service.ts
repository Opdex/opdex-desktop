import { LoggerService } from '@services/utility/logger.service';
import { Injectable, ErrorHandler, Injector } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorMiddlewareService implements ErrorHandler {
  private _logger: LoggerService;

  constructor(private injector: Injector) {
    this._logger = this.injector.get(LoggerService);
  }

  // handles all uncaught errors throughout code and logs them.
  handleError(error: unknown) {
    this._logger.error(error);
    console.error(error);
  }
}
