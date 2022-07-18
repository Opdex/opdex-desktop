import { MiningPool } from './mining-pool';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { IHydratedLiquidityPoolDetailsDto } from '@services/platform/liquidity-pool.service';
import { Token } from './token';

export class LiquidityPool {
  address: string;
  name: string;
  transactionFee: FixedDecimal;
  reserveCrs: FixedDecimal;
  reserveSrc: FixedDecimal;
  totalStaked: FixedDecimal;
  isNominated: boolean;
  srcToken: Token;
  crsToken: Token;
  stakingToken: Token;
  lpToken: Token;
  crsPerSrc: FixedDecimal;
  srcPerCrs: FixedDecimal;
  miningPool?: MiningPool;

  constructor(entity: ILiquidityPoolEntity, hydrated: IHydratedLiquidityPoolDetailsDto, miningPool: MiningPool, srcToken: Token, stakingToken: Token, crsToken: Token, lpToken: Token) {
    this.address = entity.address;
    this.name = entity.name;
    this.miningPool = miningPool;
    this.transactionFee = FixedDecimal.FromBigInt(BigInt(entity.transactionFee), 1);
    this.reserveCrs = FixedDecimal.FromBigInt(hydrated.reserveCrs, 8);
    this.reserveSrc = FixedDecimal.FromBigInt(hydrated.reserveSrc, srcToken.decimals);
    this.totalStaked = FixedDecimal.FromBigInt(hydrated.totalStaked, 8);
    this.isNominated = entity.isNominated === 1;
    this.srcToken = srcToken;
    this.crsToken = crsToken;
    this.lpToken = lpToken;
    this.stakingToken = stakingToken;
    this.crsPerSrc = this.reserveCrs.divide(this.reserveSrc);
    this.srcPerCrs = this.reserveSrc.divide(this.reserveCrs);
  }

  public get trackBy(): string {
    return `${this.address}-${this.crsPerSrc.bigInt}-${this.srcPerCrs.bigInt}-${this.totalStaked.bigInt}`;
  }
}
