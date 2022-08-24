import { LoggerService } from './../utility/logger.service';
import { Injectable, ErrorHandler, Injector } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorMiddlewareService implements ErrorHandler {
  private _logger: LoggerService;

  constructor(private injector: Injector) {
    this._logger = this.injector.get(LoggerService);
  }

  // handles all uncaught errors throughout code and logs them.
  handleError(error: Error) {
    this._logger.error(error);

    console.group('Unexpected Error:');
    console.log(error.name);
    console.log(error.message);
    console.log(error.stack);
    console.groupEnd();
  }
}
