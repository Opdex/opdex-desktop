import { ILiquidityPoolEntity, ITokenEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { IHydratedLiquidityPoolDetailsDto } from '@services/platform/liquidity-pool.service';
import { Token } from './token';

export class LiquidityPool {
  address: string;
  name: string;
  miningPool: string;
  transactionFee: number;
  totalSupply: FixedDecimal;
  reserveCrs: FixedDecimal;
  reserveSrc: FixedDecimal;
  totalStaked: FixedDecimal;
  srcToken: Token;
  crsToken: Token;
  stakingToken: Token;
  crsPerSrc: FixedDecimal;
  srcPerCrs: FixedDecimal;

  constructor(entity: ILiquidityPoolEntity, hydrated: IHydratedLiquidityPoolDetailsDto, srcToken: ITokenEntity, stakingToken: ITokenEntity) {
    this.address = entity.address;
    this.name = entity.name;
    this.miningPool = entity.miningPool;
    this.transactionFee = entity.transactionFee;
    this.totalSupply = FixedDecimal.FromBigInt(hydrated.totalSupply, 8);
    this.reserveCrs = FixedDecimal.FromBigInt(hydrated.reserveCrs, 8);
    this.reserveSrc = FixedDecimal.FromBigInt(hydrated.reserveSrc, srcToken.decimals);
    this.totalStaked = FixedDecimal.FromBigInt(hydrated.totalStaked, 8);
    this.srcToken = new Token(srcToken);
    this.crsToken = Token.Crs();
    this.stakingToken = new Token(stakingToken);
    this.crsPerSrc = this.reserveCrs.divide(this.reserveSrc);
    this.srcPerCrs = this.reserveSrc.divide(this.reserveCrs);
  }

  public get trackBy(): string {
    return `${this.address}-${this.crsPerSrc.bigInt}-${this.srcPerCrs.bigInt}-${this.totalStaked.bigInt}`;
  }
}
