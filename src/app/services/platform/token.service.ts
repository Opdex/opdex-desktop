import { Contracts } from '@lookups/contracts.lookup';
import { combineLatest, map } from 'rxjs';
import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { CirrusApiService } from "@services/api/cirrus-api.service";

@Injectable({providedIn: 'root'})
export class TokenService {
  constructor(private _cirrus: CirrusApiService) {

  }

  getToken(address: string) {
    const isODX = address === Contracts.mainnet.odx || address === Contracts.testnet.odx;

    const keys = {
      name: isODX ? 'TB' : 'Name',
      symbol: isODX ? 'TA' : 'Symbol',
      decimals: isODX ? 'TC' : 'Decimals',
      totalSupply: isODX ? 'TD' : 'TotalSupply'
    };

    const properties = [
      this._cirrus.getContractStorageItem(address, keys.name, ParameterType.String),
      this._cirrus.getContractStorageItem(address, keys.symbol, ParameterType.String),
      this._cirrus.getContractStorageItem(address, keys.decimals, ParameterType.Byte),
      this._cirrus.getContractStorageItem(address, keys.totalSupply, ParameterType.UInt256)
    ];

    return combineLatest(properties)
      .pipe(map(([name, symbol, decimals, totalSupply]) => {
        return { address, name, symbol, decimals, totalSupply }
      }));
  }
}
