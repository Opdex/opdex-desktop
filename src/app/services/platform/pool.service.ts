import { Contracts } from '@lookups/contracts.lookup';
import { ParameterType } from '@enums/parameter-type';
import { map } from 'rxjs/operators';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { combineLatest, Observable, tap, switchMap, of } from 'rxjs';
import { LocalCallPayload } from '@models/contract-calls/local-call';
import { Parameter } from '@models/contract-calls/parameter';
import { catchError } from 'rxjs';

const keys = {
  totalSupply: 'PA',
  transactionFee: 'PB',
  token: 'PC',
  reserveCrs: 'PD',
  reserveSrc: 'PE',
  kLast: 'PF',
  locked: 'PG',
  balance: 'PH',
  allowance: 'PI',
  totalStaked: 'PP'
};

@Injectable({providedIn: 'root'})
export class PoolService {
  constructor(private _cirrus: CirrusApiService) { }

  getStaticPool(address: string): Observable<any> {
    const properties = [
      this._cirrus.getContractStorageItem(address, keys.token, ParameterType.Address),
      this._cirrus.getContractStorageItem(address, keys.transactionFee, ParameterType.UInt),
    ];

    const miningPoolRequest = new LocalCallPayload(Contracts.mainnet.miningGovernance, "GetMiningPool", address, [new Parameter(ParameterType.Address, address)]);
    const miningPool$ = this._cirrus.localCall(miningPoolRequest);
    let pool: any = {};

    return combineLatest(properties)
      .pipe(
        map(([token, transactionFee]) => {
          pool = { address, token, transactionFee };
          return pool;
        }),
        switchMap((pool: any) => miningPool$
          .pipe(tap(response => pool.miningPool = response.return),
          catchError(_ => pool))
        ),
        map(_ => pool)
      );
  }

  getHydratedPool(address: string, miningPool: string): Observable<any> {
    const miningPeriodEndBlockStateKey = 'PY';

    const properties = [
      this._cirrus.getContractStorageItem(address, keys.totalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, keys.reserveCrs, ParameterType.ULong),
      this._cirrus.getContractStorageItem(address, keys.reserveSrc, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, keys.totalStaked, ParameterType.UInt256).pipe(catchError(_ => '0')),
      this._cirrus.getContractStorageItem(miningPool, miningPeriodEndBlockStateKey, ParameterType.ULong).pipe(catchError(_ => '0'))
    ];

    return combineLatest(properties)
      .pipe(
        map(([totalSupply, reserveCrs, reserveSrc, totalStaked, miningPeriodEndBlock]) => {
          return { totalSupply, reserveCrs, reserveSrc, totalStaked, miningPeriodEndBlock };
        }));
  }

  // Todo: Get Volume
  // -- Get all swaps within 5400 blocks
  // -- Add all CRS, Add all SRC
  // -- Calculate current CRS/SRC pricing
  // -- Calc volume by ($SRC * SrcTokenVolume) + ($CRS * CrsTokenVolume)
}
