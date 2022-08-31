import { MiningPool } from './mining-pool';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Token } from './token';
import { IHydratedLiquidityPoolDetailsDto } from '@interfaces/contract-properties.interface';

export class LiquidityPool {
  private _address: string;
  private _name: string;
  private _transactionFee: FixedDecimal;
  private _reserveCrs: FixedDecimal;
  private _reserveSrc: FixedDecimal;
  private _totalStaked: FixedDecimal;
  private _isNominated: boolean;
  private _srcToken: Token;
  private _crsToken: Token;
  private _stakingToken: Token;
  private _lpToken: Token;
  private _crsPerSrc: FixedDecimal;
  private _srcPerCrs: FixedDecimal;
  private _miningPool?: MiningPool;

  public get address(): string {
    return this._address;
  }

  public get name(): string {
    return this._name;
  }

  public get transactionFee(): FixedDecimal {
    return this._transactionFee;
  }

  public get reserveCrs(): FixedDecimal {
    return this._reserveCrs;
  }

  public get reserveSrc(): FixedDecimal {
    return this._reserveSrc;
  }

  public get totalStaked(): FixedDecimal {
    return this._totalStaked;
  }

  public get isNominated(): boolean {
    return this._isNominated;
  }

  public get srcToken(): Token {
    return this._srcToken;
  }

  public get crsToken(): Token {
    return this._crsToken;
  }

  public get stakingToken(): Token {
    return this._stakingToken;
  }

  public get lpToken(): Token {
    return this._lpToken;
  }

  public get crsPerSrc(): FixedDecimal {
    return this._crsPerSrc;
  }

  public get srcPerCrs(): FixedDecimal {
    return this._srcPerCrs;
  }

  public get miningPool(): MiningPool {
    return this._miningPool;
  }

  constructor(entity: ILiquidityPoolEntity, hydrated: IHydratedLiquidityPoolDetailsDto, miningPool: MiningPool, srcToken: Token, stakingToken: Token, crsToken: Token, lpToken: Token) {
    this._address = entity.address;
    this._name = entity.name;
    this._miningPool = miningPool;
    this._transactionFee = FixedDecimal.FromBigInt(BigInt(entity.transactionFee), 1);
    this._reserveCrs = FixedDecimal.FromBigInt(hydrated.reserveCrs, 8);
    this._reserveSrc = FixedDecimal.FromBigInt(hydrated.reserveSrc, srcToken.decimals);
    this._totalStaked = FixedDecimal.FromBigInt(hydrated.totalStaked, 8);
    this._isNominated = entity.isNominated === 1;
    this._srcToken = srcToken;
    this._crsToken = crsToken;
    this._lpToken = lpToken;
    this._stakingToken = stakingToken;
    this._crsPerSrc = this._reserveCrs.divide(this.reserveSrc);
    this._srcPerCrs = this._reserveSrc.divide(this.reserveCrs);
  }

  public get trackBy(): string {
    return `${this.address}-${this.crsPerSrc.bigInt}-${this.srcPerCrs.bigInt}-${this.totalStaked.bigInt}`;
  }
}
