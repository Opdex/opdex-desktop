import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { Contracts } from "@lookups/contracts.lookup";
import { ReceiptSearchRequest } from "@models/cirrusApi/requests/receipt-search.request";
import { Observable, map } from "rxjs";

@Injectable({providedIn: 'root'})
export class MiningService {
  constructor(private _cirrus: CirrusApiService) {

  }

  getRewardedPools(fromBlock: number = 3500000): Observable<any> {
    const rewardMiningPoolLog = 'RewardMiningPoolLog';
    const request = new ReceiptSearchRequest(Contracts.mainnet.miningGovernance, rewardMiningPoolLog, fromBlock);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const logs = [];
          console.log(response);

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === rewardMiningPoolLog)
              .forEach(log => logs.push({
                ...log.log.data,
                block: tx.blockNumber
              }));
          });

          console.log(logs);
          return logs;
      }));
  }
}
