import { MiningPoolStateKeys } from '@enums/contracts/state-keys/mining-pool-state-keys';
import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { Observable, combineLatest, map } from "rxjs";

export interface IMiningPoolDetailsDto {
  address: string;
  stakingToken: string;
  miningPeriodEndBlock: number;
  rewardRate: BigInt;
  totalSupply: BigInt;
}

@Injectable({providedIn: 'root'})
export class MiningPoolService {
  constructor(private _cirrus: CirrusApiService) { }

  getHydratedMiningPool(miningPool: string): Observable<IMiningPoolDetailsDto> {
    const properties = [
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.StakingToken, ParameterType.Address),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.RewardRate, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.TotalSupply, ParameterType.UInt256)
    ];

    return combineLatest(properties)
      .pipe(
        map(([stakingToken, miningPeriodEndBlock, rewardRate, totalSupply]) => {
          return {
            stakingToken,
            miningPeriodEndBlock: parseFloat(miningPeriodEndBlock),
            rewardRate: BigInt(rewardRate),
            totalSupply: BigInt(totalSupply),
            address: miningPool
          };
        }));
  }
}
