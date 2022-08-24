import { Injectable } from "@angular/core";
import { ElectronService } from "./electron-service";

@Injectable({providedIn: 'root'})
export class LoggerService {
  constructor(
    private _electron: ElectronService
  ) { }

  public info = (data: any) => this._log('info', data);
  public warn = (data: any) => this._log('warn', data);
  public error = (data: any) => this._log('error', data);
  public verbose = (data: any) => this._log('verbose', data);
  public debug = (data: any) => this._log('debug', data);
  public silly = (data: any) => this._log('silly', data);

  private _log(level: string, data: string, notify = false) {
    console.log(data);

    if (this._electron.isElectron) {
      this._electron.send('log', new Log(level, data));
    }

    // if (notify) {
    //   this._notifications.alert(new Notification('Error', data));
    // }
  }
}

class Log {
  level: string;
  data: any;

  constructor(level: string, data: any) {
    this.level = level;
    this.data = data;
  }
}
