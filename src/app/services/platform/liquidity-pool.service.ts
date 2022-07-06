import { MiningGovernanceMethods } from './../../enums/contracts/methods/mining-governance-methods';
import { MiningPoolStateKeys } from '@enums/contracts/state-keys/mining-pool-state-keys';
import { ParameterType } from '@enums/parameter-type';
import { map } from 'rxjs/operators';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { combineLatest, Observable, tap, switchMap, of } from 'rxjs';
import { LocalCallPayload } from '@models/cirrusApi/contract-calls/local-call';
import { Parameter } from '@models/cirrusApi/contract-calls/parameter';
import { catchError } from 'rxjs';
import { LiquidityPoolStateKeys } from '@enums/contracts/state-keys/liquidity-pool-state-keys';
import { EnvironmentsService } from '@services/utility/environments.service';

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
  constructor(
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  getStaticPool(address: string): Observable<IBaseLiquidityPoolDetailsDto> {
    const properties = [
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.Token, ParameterType.Address),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.TransactionFee, ParameterType.UInt),
    ];

    const miningPoolRequest = new LocalCallPayload(this._env.contracts.miningGovernance, MiningGovernanceMethods.GetMiningPool, address, [new Parameter(ParameterType.Address, address)]);
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
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.TotalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.ReserveCrs, ParameterType.ULong),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.ReserveSrc, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, LiquidityPoolStateKeys.TotalStaked, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong).pipe(catchError(_ => of('0')))
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