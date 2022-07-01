import { ReceiptSearchRequest } from '@models/cirrusApi/requests/receipt-search.request';
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
    const createPoolLog = 'CreateLiquidityPoolLog';
    const request = new ReceiptSearchRequest(this._env.contracts.market, createPoolLog, fromBlock);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const pools = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === createPoolLog)
              .forEach(log => pools.push(log.log.data));
          });

          return pools;
      }));
  }
}
