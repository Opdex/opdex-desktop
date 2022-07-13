import { OdxStateKeys, StandardTokenStateKeys, InterfluxTokenStateKeys } from '@enums/contracts/state-keys/token-state-keys';
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

export interface IHydratedTokenDetailsDto {
  totalSupply: BigInt;
  nextDistributionBlock?: number;
  periodDuration?: number;
  periodIndex?: number;
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
      name: isODX ? OdxStateKeys.Name : StandardTokenStateKeys.Name,
      symbol: isODX ? OdxStateKeys.Symbol : StandardTokenStateKeys.Symbol,
      decimals: isODX ? OdxStateKeys.Decimals : StandardTokenStateKeys.Decimals,
      totalSupply: isODX ? OdxStateKeys.TotalSupply : StandardTokenStateKeys.TotalSupply
    };

    const properties = [
      this._cirrus.getContractStorageItem(address, keys.name, ParameterType.String),
      this._cirrus.getContractStorageItem(address, keys.symbol, ParameterType.String),
      this._cirrus.getContractStorageItem(address, keys.decimals, ParameterType.Byte),
      this._cirrus.getContractStorageItem(address, keys.totalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, InterfluxTokenStateKeys.NativeChain, ParameterType.String).pipe(catchError(_ => of(''))),
      this._cirrus.getContractStorageItem(address, InterfluxTokenStateKeys.NativeAddress, ParameterType.String).pipe(catchError(_ => of(''))),
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

  // Todo: Consider calculating FIAT pricing here
  getHydratedToken(address: string): Observable<IHydratedTokenDetailsDto> {
    const isODX = address === this._env.contracts.odx;
    const totalSupplyKey = isODX ? OdxStateKeys.TotalSupply : StandardTokenStateKeys.TotalSupply

    const properties = [
      this._cirrus.getContractStorageItem(address, totalSupplyKey, ParameterType.UInt256)
    ];

    if (isODX) {
      properties.push(
        this._cirrus.getContractStorageItem(address, OdxStateKeys.NextDistributionBlock, ParameterType.ULong),
        this._cirrus.getContractStorageItem(address, OdxStateKeys.PeriodDuration, ParameterType.ULong),
        this._cirrus.getContractStorageItem(address, OdxStateKeys.PeriodIndex, ParameterType.UInt)
      );
    }

    return combineLatest(properties)
      .pipe(
        map(values => {
          let data: any = {
            totalSupply: BigInt(values[0])
          };

          if (isODX) {
            data.nextDistributionBlock = parseFloat(values[1]);
            data.periodDuration = parseFloat(values[2]);
            data.periodIndex = parseFloat(values[3]);
          }

          return data;
        })
      )
  }
}
