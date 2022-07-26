import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { Injectable } from "@angular/core";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { map, Observable } from 'rxjs';
import { EnvironmentsService } from '@services/utility/environments.service';

@Injectable({providedIn: 'root'})
export class MarketService {
  constructor(
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  getMarketPools(fromBlock: number = 3500000): Observable<any> {
    const createPoolLog = TransactionLogTypes.CreateLiquidityPoolLog;
    const request = new ReceiptSearchRequest(this._env.contracts.market, fromBlock, createPoolLog);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const pools = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === createPoolLog)
              .forEach(log => pools.push({...log.log.data, createdBlock: tx.blockNumber}));
          });

          return pools;
      }));
  }
}
