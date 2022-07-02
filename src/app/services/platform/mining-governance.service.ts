import { MiningGovernanceStateKeys } from '@enums/contracts/state-keys/mining-governance-state-keys';
import { LocalCallPayload } from '@models/cirrusApi/contract-calls/local-call';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { ReceiptSearchRequest } from "@models/cirrusApi/requests/receipt-search.request";
import { Observable, map, combineLatest } from "rxjs";
import { ParameterType } from '@enums/parameter-type';
import { EnvironmentsService } from '@services/utility/environments.service';
import { LogTypes } from '@enums/contracts/log-types';
import { MiningGovernanceMethods } from '@enums/contracts/methods/mining-governance-methods';

@Injectable({providedIn: 'root'})
export class MiningGovernanceService {
  constructor(
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  getHydratedMiningGovernance(): Observable<any> {
    const { miningGovernance } = this._env.contracts;

    const properties = [
      this._cirrus.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MinedToken, ParameterType.Address),
      this._cirrus.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.NominationPeriodEnd, ParameterType.ULong),
      this._cirrus.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MiningPoolsFunded, ParameterType.UInt),
      this._cirrus.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MiningPoolReward, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MiningDuration, ParameterType.ULong)
    ];

    return combineLatest(properties)
      .pipe(
        map(([minedToken, nominationPeriodEnd, miningPoolsFunded, miningPoolReward, miningDuration]) => {
          return { minedToken, nominationPeriodEnd, miningPoolsFunded, miningPoolReward, miningDuration, address: miningGovernance };
        }));
  }

  getRewardedPools(fromBlock: number = 3500000): Observable<any> {
    const type = LogTypes.RewardMiningPoolLog;
    const request = new ReceiptSearchRequest(this._env.contracts.miningGovernance, type, fromBlock);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const logs = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === type)
              .forEach(log => logs.push({
                ...log.log.data,
                block: tx.blockNumber
              }));
          });

          return logs;
      }));
  }

  getNominatedPools(): Observable<any> {
    const { miningGovernance } = this._env.contracts;
    const request = new LocalCallPayload(miningGovernance, MiningGovernanceMethods.GetNominations, miningGovernance);
    return this._cirrus.localCall(request).pipe(map(response => response.return));
  }
}
