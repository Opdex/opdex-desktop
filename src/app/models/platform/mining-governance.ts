import { FixedDecimal } from '@models/types/fixed-decimal';
import { Token } from './token';

export class MiningGovernance {
  private _address: string;
  private _periodEndBlock: number;
  private _periodRemainingBlocks: number;
  private _periodBlockDuration: number;
  private _periodsUntilRewardReset: number;
  private _miningPoolRewardPerPeriod: FixedDecimal;
  private _nominationPeriodEndDate: string;
  private _totalRewardsPerPeriod: FixedDecimal;
  private _minedToken: Token;

  public get address(): string {
    return this._address;
  }

  public get periodEndBlock(): number {
    return this._periodEndBlock;
  }

  public get periodRemainingBlocks(): number {
    return this._periodRemainingBlocks;
  }

  public get periodBlockDuration(): number {
    return this._periodBlockDuration;
  }

  public get periodsUntilRewardReset(): number {
    return this._periodsUntilRewardReset;
  }

  public get miningPoolRewardPerPeriod(): FixedDecimal {
    return this._miningPoolRewardPerPeriod;
  }

  public get totalRewardsPerPeriod(): FixedDecimal {
    return this._totalRewardsPerPeriod;
  }

  public get minedToken(): Token {
    return this._minedToken;
  }

  public get nominationPeriodEndDate(): string {
    return this._nominationPeriodEndDate;
  }

  constructor (governance: any, latestBlock: number) {
    this._address = governance.address;
    this._periodEndBlock = governance.nominationPeriodEnd;
    this._periodRemainingBlocks = governance.nominationPeriodEnd > latestBlock
      ? governance.nominationPeriodEnd - latestBlock
      : 0;
    this._periodBlockDuration = governance.miningDuration;
    this._periodsUntilRewardReset = (48 - governance.miningPoolsFunded) / 4;
    this._miningPoolRewardPerPeriod = FixedDecimal.FromBigInt(governance.miningPoolReward, 8);
    this._totalRewardsPerPeriod = FixedDecimal.FromBigInt((BigInt(governance.miningPoolReward) * BigInt(4)), 8);

    const remainingSeconds = (this.periodRemainingBlocks * 16);
    let date = new Date();
    date.setSeconds(date.getSeconds() + remainingSeconds);
    this._nominationPeriodEndDate = date.toISOString();
  }

  setMinedToken(token: Token) {
    this._minedToken = token;
  }
}
