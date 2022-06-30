import { MiningPoolStateKeys } from '@lookups/state-keys/mining-pool-state-keys';
import { Contracts } from '@lookups/contracts.lookup';
import { ParameterType } from '@enums/parameter-type';
import { map } from 'rxjs/operators';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { combineLatest, Observable, tap, switchMap, of } from 'rxjs';
import { LocalCallPayload } from '@models/contract-calls/local-call';
import { Parameter } from '@models/contract-calls/parameter';
import { catchError } from 'rxjs';
import { LiquidityPoolStateKeys } from '@lookups/state-keys/liquidity-pool-state-keys';

export interface IBaseLiquidityPoolDetailsDto {
  address: string;
  token: string;
  miningPool: string;
  transactionFee: number;
}

export interface IHydratedLiquidityPoolDetailsDto {
  address: string;
  totalSupply: BigInt;
  reserveCrs: BigInt;
  reserveSrc: BigInt;
  totalStaked: BigInt;
  miningPeriodEndBlock: number;
}

@Injectable({providedIn: 'root'})
export class LiquidityPoolService {
  constructor(private _cirrus: CirrusApiService) { }

  getStaticPool(address: string): Observable<IBaseLiquidityPoolDetailsDto> {
    const properties = [
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.token, ParameterType.Address),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.transactionFee, ParameterType.UInt),
    ];

    const miningPoolRequest = new LocalCallPayload(Contracts.mainnet.miningGovernance, "GetMiningPool", address, [new Parameter(ParameterType.Address, address)]);
    const miningPool$ = this._cirrus.localCall(miningPoolRequest);
    let pool: IBaseLiquidityPoolDetailsDto;

    return combineLatest(properties)
      .pipe(
        map(([token, transactionFee]) => {
          pool = {
            address,
            token,
            transactionFee: parseFloat(transactionFee),
            miningPool: null
          };
          return pool;
        }),
        switchMap((pool: any) => miningPool$
          .pipe(tap(response => pool.miningPool = response.return),
          catchError(_ => pool))
        ),
        map(_ => pool)
      );
  }

  getHydratedPool(address: string, miningPool: string): Observable<IHydratedLiquidityPoolDetailsDto> {
    const properties = [
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.totalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.reserveCrs, ParameterType.ULong),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.reserveSrc, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.totalStaked, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.miningPeriodEndBlock, ParameterType.ULong).pipe(catchError(_ => of('0')))
    ];

    return combineLatest(properties)
      .pipe(
        map(([totalSupply, reserveCrs, reserveSrc, totalStaked, miningPeriodEndBlock]) => {
          return {
            address,
            totalSupply: BigInt(totalSupply),
            reserveCrs: BigInt(reserveCrs),
            reserveSrc: BigInt(reserveSrc),
            totalStaked: BigInt(totalStaked),
            miningPeriodEndBlock: parseFloat(miningPeriodEndBlock)
          };
        }));
  }

  // Todo: Get Volume
  // -- Get all swaps within 5400 blocks
  // -- Add all CRS, Add all SRC
  // -- Calculate current CRS/SRC pricing
  // -- Calc volume by ($SRC * SrcTokenVolume) + ($CRS * CrsTokenVolume)
}
