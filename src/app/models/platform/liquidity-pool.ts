import { ILiquidityPoolEntity, ITokenEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
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
  stakingToken: Token;


  constructor(entity: ILiquidityPoolEntity, hydrated: any, srcToken: ITokenEntity, stakingToken: ITokenEntity) {
    this.address = entity.address;
    this.name = entity.name;
    this.miningPool = entity.miningPool;
    this.transactionFee = entity.transactionFee;
    this.totalSupply = FixedDecimal.FromBigInt(hydrated.totalSupply, 8);
    this.reserveCrs = FixedDecimal.FromBigInt(hydrated.reserveCrs, 8);
    this.reserveSrc = FixedDecimal.FromBigInt(hydrated.reserveSrc, srcToken.decimals);
    this.totalStaked = FixedDecimal.FromBigInt(hydrated.totalStaked, 8);
    this.srcToken = new Token(srcToken);
    this.stakingToken = new Token(stakingToken);
  }
}
