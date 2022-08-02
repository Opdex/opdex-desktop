import { ElectronService } from './electron-service';
import { IEnvironment, IEnvironmentContracts } from '@interfaces/environment.interface';
import { Injectable } from '@angular/core';
import { Environments } from '@lookups/environments.lookup';
import { Network } from 'src/app/enums/networks';
import { environment } from '@environments/environment';

@Injectable({providedIn: 'root'})
export class EnvironmentsService {
  private _env: IEnvironment;

  public get cirrusApi(): string {
    return this._env.cirrusApi;
  }

  public get network(): Network {
    return this._env.network;
  }

  public get startHeight(): number {
    return this._env.startHeight;
  }

  public get contracts(): IEnvironmentContracts {
    return this._env.contracts;
  }

  constructor(private _electron: ElectronService) { }

  async setNetwork(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._electron.isElectron) {
        this._electron.send('getNetwork');

        this._electron.on('getNetworkResponse', (_, response: string) => {
          this._setEnv(Network[response]);
          resolve();
        });
      } else {
        // If not electron, serving via web locally so use environment variables
        this._setEnv(environment.network);
        resolve();
      }
    });
  }

  private _setEnv(network: Network): void {
    this._env = {...Environments.find(e => e.network === network)};
  }
}
