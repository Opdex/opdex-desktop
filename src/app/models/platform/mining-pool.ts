import { FixedDecimal } from '@models/types/fixed-decimal';
import { IMiningPoolDetailsDto } from '@services/platform/liquidity-pool.service';

export class MiningPool {
  address: string;
  stakingToken: string;
  minedToken: string;
  miningPeriodEndBlock: number;
  isActive: boolean;
  rewardPerBlock: FixedDecimal;
  tokensMining: FixedDecimal;

  constructor(data: IMiningPoolDetailsDto) {
    this.address = data.address;
    this.stakingToken = data.stakingToken;
    // this.minedToken = data.
    this.miningPeriodEndBlock = data.miningPeriodEndBlock;
    this.rewardPerBlock = FixedDecimal.FromBigInt(data.rewardRate, 8);
    this.tokensMining = FixedDecimal.FromBigInt(data.totalSupply, 8);
  }
}
