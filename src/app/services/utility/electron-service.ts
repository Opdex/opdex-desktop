import { Injectable } from "@angular/core";
import { IpcRenderer } from "electron";

@Injectable({providedIn: 'root'})
export class ElectronService {
  private _ipc: IpcRenderer;
  private _isElectron: boolean = false;

  get isElectron(): boolean {
    return this._isElectron;
  }

  constructor() {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
        this._isElectron = true;

      } catch (e) {
        throw e;
      }
    } else {
      console.warn('Electron\'s IPC was not loaded');
    }
  }

  public on(channel: string, listener: any): void {
    if (!this._ipc) return;

    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args: any[]): void {
    if (!this._ipc) return;

    this._ipc.send(channel, ...args);
  }
}
