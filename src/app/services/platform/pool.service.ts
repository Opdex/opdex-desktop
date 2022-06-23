import { ParameterType } from '@enums/parameter-type';
import { map } from 'rxjs/operators';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { combineLatest, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class PoolService {
  constructor(private _cirrus: CirrusApiService) {

  }

  createPool(): void {

  }

  getPool(address: string): Observable<any> {
    const keys = {
      totalSupply: 'PA',
      transactionFee: 'PB',
      token: 'PC',
      reserveCrs: 'PD',
      reserveSrc: 'PE',
      kLast: 'PF',
      locked: 'PG',
      balance: 'PH',
      allowance: 'PI'
    };

    const properties = [
      this._cirrus.getContractStorageItem(address, keys.token, ParameterType.Address),
      this._cirrus.getContractStorageItem(address, keys.totalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, keys.reserveCrs, ParameterType.ULong),
      this._cirrus.getContractStorageItem(address, keys.reserveSrc, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(address, keys.transactionFee, ParameterType.UInt)
    ];

    return combineLatest(properties)
      .pipe(map(([token, totalSupply, reserveCrs, reserveSrc, transactionFee]) => {
        return { address, token, totalSupply, reserveCrs, reserveSrc, transactionFee }
      }));
  }
}
