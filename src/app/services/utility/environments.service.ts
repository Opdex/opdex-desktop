import { IEnvironment, IEnvironmentContracts } from '@interfaces/environment.interface';
import { Injectable } from '@angular/core';
import { Environments } from '@lookups/environments.lookup';
import { Network } from 'src/app/enums/networks';

@Injectable({providedIn: 'root'})
export class EnvironmentsService {
  private _env: IEnvironment;

  public get cirrusApi(): string {
    return this._env.cirrusApi;
  }

  public get network(): Network {
    return this._env.network;
  }

  public get contracts(): IEnvironmentContracts {
    return this._env.contracts;
  }

  constructor() {
    // Todo: Find network via runtime flags set in electron.
    const env = this._find(Network.Mainnet);

    this._env = {...env};
  }

  private _find(network: Network) {
    return {...Environments.find(e => e.network === network)};
  }
}
