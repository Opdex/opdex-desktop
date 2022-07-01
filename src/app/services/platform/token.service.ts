import { EnvironmentsService } from '@services/utility/environments.service';
import { combineLatest, map, catchError, of, Observable } from 'rxjs';
import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { CirrusApiService } from "@services/api/cirrus-api.service";

export interface ITokenDetailsDto {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigInt;
  nativeChain: string;
  nativeChainAddress: string;
}

@Injectable({providedIn: 'root'})
export class TokenService {
  constructor(
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  getToken(address: string): Observable<ITokenDetailsDto> {
    const isODX = address === this._env.contracts.odx;

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
      this._cirrus.getContractStorageItem(address, keys.totalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, 'NativeChain', ParameterType.String).pipe(catchError(_ => of(''))),
      this._cirrus.getContractStorageItem(address, 'NativeAddress', ParameterType.String).pipe(catchError(_ => of(''))),
    ];

    return combineLatest(properties)
      .pipe(map(([name, symbol, decimals, totalSupply, nativeChain, nativeChainAddress]) => {
        return {
          address,
          name,
          symbol,
          decimals: parseFloat(decimals),
          totalSupply: BigInt(totalSupply),
          nativeChain,
          nativeChainAddress
        }
      }));
  }
}
