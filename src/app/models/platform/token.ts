import { Icons } from '@enums/icons';
import { IHydratedTokenDetailsDto } from '@interfaces/contract-properties.interface';
import { ITokenEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';

export class Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  sats: BigInt;
  totalSupply: FixedDecimal;
  wrappedToken: WrappedToken;
  distribution?: TokenDistribution;
  pricing: any;

  get isCrs(): boolean {
    return this.address === 'CRS';
  }

  get isStaking(): boolean {
    return !!this.distribution;
  }

  public get trackBy(): string {
    const { pricing, address } = this;
    return `${address}-${pricing.usd}`;
  }

  constructor(entity: ITokenEntity, hydrated: IHydratedTokenDetailsDto, pricing?: any) {
    this.address = entity.address;
    this.name = entity.name;
    this.symbol = entity.symbol;
    this.decimals = entity.decimals;
    this.sats = BigInt('1'.padEnd(entity.decimals+1, '0'));
    this.totalSupply = FixedDecimal.FromBigInt(hydrated.totalSupply, entity.decimals);
    this.pricing = pricing;

    if (entity.nativeChain && entity.nativeChain !== 'Cirrus') {
      this.wrappedToken = new WrappedToken({
        chain: entity.nativeChain,
        address: entity.nativeChainAddress,
        // Todo: should validate the ethereum address via checksum (we do but don't mark success)
        validated: true,
        // Validate supported tokens via Cirrus FN API
        trusted: true
      } as IWrappedToken);
    }

    if (hydrated.nextDistributionBlock) {
      this.distribution = new TokenDistribution(hydrated.nextDistributionBlock);
    }
  }

  static CRS(): Token {
    return new Token({
      name: 'Cirrus',
      symbol: 'CRS',
      address: 'CRS',
      decimals: 8,
      nativeChain: 'Cirrus',
      createdBlock: 1
    }, {
      totalSupply: BigInt('10000000000000000')
    })
  }
}

export class WrappedToken {
  private _custodian: string;
  private _chain: string;
  private _address: string;
  private _validated: boolean;
  private _trusted: boolean;

  public get custodian(): string {
    return this._custodian;
  }

  public get chain(): string {
    return this._chain;
  }

  public get address(): string {
    return this._address;
  }

  public get validated(): boolean {
    return this._validated;
  }

  public get trusted(): boolean {
    return this._trusted;
  }

  public get status(): string {
    const trust = this.trusted ? 'Trusted' : 'Untrusted'
    const validated = this.validated ? ' and valid' : ' but invalid';

    return `${trust}${!!this.address ? validated : ''}`;
  }

  public get statusIcon(): string {
    if (this.address) {
      return this.trusted && this.validated ? Icons.check : Icons.warning;
    }

    return this.trusted ? Icons.check : Icons.warning;
  }

  constructor(wrapped: IWrappedToken) {
    this._custodian = wrapped.custodian;
    this._chain = wrapped.chain;
    this._address = wrapped.address;
    this._validated = wrapped.validated;
    this._trusted = wrapped.trusted;
  }
}

export class TokenDistribution {
  private _nextDistributionBlock: number;

  public get nextDistributionBlock(): number {
    return this._nextDistributionBlock;
  }
  public get distributionPeriodBlockDuration(): number {
    return 1971000; // Cirrus blocks per year
  }

  constructor(nextDistributionBlock: number) {
    this._nextDistributionBlock = nextDistributionBlock;
  }

  isReady(latestBlock: number): boolean {
    return this._nextDistributionBlock <= latestBlock;
  }
}

export interface IWrappedToken {
  custodian: string;
  chain: string;
  address: string;
  validated: boolean;
  trusted: boolean;
}

export interface ITokenDistribution {
  vault: string;
  miningGovernance: string;
  nextDistributionBlock: number;
  history: ITokenDistributionHistory[];
}

export interface ITokenDistributionHistory {
  vault: string;
  miningGovernance: string;
  block: number;
}
