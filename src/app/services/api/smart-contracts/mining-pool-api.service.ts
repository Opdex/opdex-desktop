import { MiningPoolStateKeys } from '@enums/contracts/state-keys/mining-pool-state-keys';
import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { Observable, map, catchError, of, zip } from "rxjs";

export interface IMiningPoolDetailsDto {
  address: string;
  stakingToken: string;
  miningPeriodEndBlock: number;
  rewardRate: BigInt;
  totalSupply: BigInt;
}

@Injectable({providedIn: 'root'})
export class MiningPoolApiService {
  constructor(private _cirrus: CirrusApiService) { }

  getHydratedMiningPool(miningPool: string): Observable<IMiningPoolDetailsDto> {
    const properties = [
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.StakingToken, ParameterType.Address).pipe(catchError(_ => of(''))),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong).pipe(catchError(_ => of('0'))),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.RewardRate, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.TotalSupply, ParameterType.UInt256).pipe(catchError(_ => of('0')))
    ];

    return zip(properties)
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

  getMiningPeriodEndBlocks(miningPools: string[]): Observable<{ miningPeriodEndBlock: number, miningPool: string}[]> {
    const uniquePools = miningPools
      .filter((value, index, self) => self.lastIndexOf(value) === index)

    const properties = uniquePools
      .map(miningPool => this._cirrus.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong))

    return zip(properties)
      .pipe(
        map(endBlocks => {
          return endBlocks.map((block, index) => {
            return {
              miningPeriodEndBlock: parseFloat(block),
              miningPool: uniquePools[index]
            }
          })
        }));
  }
}
