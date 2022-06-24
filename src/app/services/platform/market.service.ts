import { Contracts } from '@lookups/contracts.lookup';
import { ReceiptSearchRequest } from '@models/cirrusApi/requests/receipt-search.request';
import { Injectable } from "@angular/core";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { map, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class MarketService {
  constructor(private _cirrus: CirrusApiService) {

  }

  getMarketPools(fromBlock: number = 3500000): Observable<any> {
    const createPoolLog = 'CreateLiquidityPoolLog';
    const request = new ReceiptSearchRequest(Contracts.mainnet.market, createPoolLog, fromBlock);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const pools = [];
          console.log(response);

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === createPoolLog)
              .forEach(log => pools.push(log.log.data));
          });

          console.log(pools);
          return pools;
      }));
  }
}
