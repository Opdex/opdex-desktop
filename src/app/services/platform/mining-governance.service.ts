import { UserContextService } from '@services/utility/user-context.service';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { MiningGovernanceMethods } from '@enums/contracts/methods/mining-governance-methods';
import { EnvironmentsService } from '@services/utility/environments.service';
import { Injectable } from "@angular/core";
import { MiningGovernance } from "@models/platform/mining-governance";
import { firstValueFrom, map, Observable, zip } from 'rxjs';
import { MiningGovernanceStateKeys } from '@enums/contracts/state-keys/mining-governance-state-keys';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { ParameterType } from '@enums/parameter-type';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { LocalCallRequest } from '@models/cirrusApi/contract-call';
import { TransactionQuote } from '@models/platform/transaction-quote';

@Injectable({providedIn: 'root'})
export class MiningGovernanceService {
  private _miningGovernance: string;

  constructor(
    private _cirrusApi: CirrusApiService,
    private _env: EnvironmentsService,
    private _userContextService: UserContextService
  ) {
    this._miningGovernance = this._env.contracts.miningGovernance;
  }

  public async getMiningGovernance(latestBlock: number): Promise<MiningGovernance> {
    const hydrated = await firstValueFrom(this._getRawHydratedMiningGovernance$());
    return new MiningGovernance(hydrated, latestBlock);
  }

  public async rewardMiningPoolsQuote(): Promise<TransactionQuote> {
    const { wallet } = this._userContextService.userContext;
    const request = new LocalCallRequest(this._miningGovernance, MiningGovernanceMethods.RewardMiningPools, wallet.address);
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public getRewardedPoolReceipts$(fromBlock: number, endBlock: number): Observable<any> {
    const type = TransactionLogTypes.RewardMiningPoolLog;
    const request = new ReceiptSearchRequest(this._env.contracts.miningGovernance, fromBlock, type, endBlock);

    return this._cirrusApi.searchContractReceipts(request)
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

  public getRawNominatedPools$(): Observable<{ stakingPool: string; weight: BigInt}[]> {
    const request = new LocalCallRequest(this._miningGovernance, MiningGovernanceMethods.GetNominations, this._miningGovernance);
    return this._cirrusApi.localCall(request).pipe(map(response => response.return));
  }

  private _getRawHydratedMiningGovernance$(): Observable<any> {
    const { miningGovernance } = this._env.contracts;

    const properties = [
      this._cirrusApi.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MinedToken, ParameterType.Address),
      this._cirrusApi.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.NominationPeriodEnd, ParameterType.ULong),
      this._cirrusApi.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MiningPoolsFunded, ParameterType.UInt),
      this._cirrusApi.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MiningPoolReward, ParameterType.UInt256),
      this._cirrusApi.getContractStorageItem(miningGovernance, MiningGovernanceStateKeys.MiningDuration, ParameterType.ULong)
    ];

    return zip(properties)
      .pipe(
        map(([minedToken, nominationPeriodEnd, miningPoolsFunded, miningPoolReward, miningDuration]) => {
          return { minedToken, nominationPeriodEnd, miningPoolsFunded, miningPoolReward, miningDuration, address: miningGovernance };
        }));
  }
}
