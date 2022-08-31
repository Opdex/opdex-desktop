import { toChecksumAddress } from 'ethereum-checksum-address';
import { Icons } from '@enums/icons';
import { IHydratedTokenDetailsDto } from '@interfaces/contract-properties.interface';
import { ITokenEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';

export class Token {
  private _address: string;
  private _name: string;
  private _symbol: string;
  private _decimals: number;
  private _sats: BigInt;
  private _totalSupply: FixedDecimal;
  private _wrappedToken?: WrappedToken;
  private _distribution?: TokenDistribution;
  private _pricing: any;

  get address(): string {
    return this._address;
  }

  get name(): string {
    return this._name;
  }

  get symbol(): string {
    return this._symbol;
  }

  get decimals(): number {
    return this._decimals;
  }

  get sats(): BigInt {
    return this._sats;
  }

  get totalSupply(): FixedDecimal {
    return this._totalSupply;
  }

  get wrappedToken(): WrappedToken {
    return this._wrappedToken;
  }

  get distribution(): TokenDistribution {
    return this._distribution;
  }

  get pricing(): any {
    return this._pricing;
  }

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

  constructor(entity: ITokenEntity, hydrated: IHydratedTokenDetailsDto, pricing?: any, trusted?: boolean) {
    this._address = entity.address;
    this._name = entity.name;
    this._symbol = entity.symbol;
    this._decimals = entity.decimals;
    this._sats = BigInt('1'.padEnd(entity.decimals+1, '0'));
    this._totalSupply = FixedDecimal.FromBigInt(hydrated.totalSupply, entity.decimals);
    this._pricing = pricing;

    if (entity.nativeChain && entity.nativeChain !== 'Cirrus') {
      this._wrappedToken = new WrappedToken({
        chain: entity.nativeChain,
        address: entity.nativeChainAddress,
        trusted
      });
    }

    if (hydrated.nextDistributionBlock) {
      this._distribution = new TokenDistribution(hydrated.nextDistributionBlock);
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
  private _chain: string;
  private _address: string;
  private _validated: boolean = false;
  private _trusted: boolean = false;

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
    this._chain = wrapped.chain;
    this._trusted = wrapped.trusted;
    this._setAddress(wrapped.address);
  }

  private _setAddress(address: string): void {
    try {
      this._address = toChecksumAddress(address);
      this._validated = true;
    } catch {
      this._address = address;
    }
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
  chain: string;
  address: string;
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
