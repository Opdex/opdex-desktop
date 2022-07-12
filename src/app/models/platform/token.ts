import { Icons } from '@enums/icons';
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

  get isCrs(): boolean {
    return this.address === 'CRS';
  }

  constructor(entity: ITokenEntity) {
    this.address = entity.address;
    this.name = entity.name;
    this.symbol = entity.symbol;
    this.decimals = entity.decimals;
    this.sats = BigInt('1'.padEnd(entity.decimals+1, '0'));
    this.totalSupply = FixedDecimal.FromBigInt(BigInt(0), entity.decimals);

    if (entity.nativeChain !== 'Cirrus') {
      this.wrappedToken = new WrappedToken({
        chain: entity.nativeChain,
        address: entity.nativeChainAddress,
        // Todo: should validate the ethereum address via checksum (we do but don't mark success)
        validated: true,
        // Validate supported tokens via Cirrus FN API
        trusted: true
      } as IWrappedToken);
    }
  }

  static CRS(): Token {
    return new Token({
      name: 'Cirrus',
      symbol: 'CRS',
      address: 'CRS',
      decimals: 8,
      nativeChain: 'Cirrus'
    })
  }

  static OLPT(address: string): Token {
    return new Token({
      name: 'Liquidity Pool Token',
      symbol: 'OLPT',
      address,
      decimals: 8,
      nativeChain: 'Cirrus'
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
  private _vault: string;
  private _miningGovernance: string;
  private _nextDistributionBlock: number;
  private _history: TokenDistributionHistory[];

  public get vault(): string {
    return this._vault;
  }

  public get miningGovernance(): string {
    return this._miningGovernance;
  }

  public get nextDistributionBlock(): number {
    return this._nextDistributionBlock;
  }

  public get history(): TokenDistributionHistory[] {
    return this._history || [];
  }

  constructor(distribution: ITokenDistribution) {
    if (!!distribution === false) return;

    this._vault = distribution.vault;
    this._miningGovernance = distribution.miningGovernance;
    this._nextDistributionBlock = distribution.nextDistributionBlock;
    this._history = distribution.history.map(history => new TokenDistributionHistory(history));
  }

  isReady(latestBlock: number): boolean {
    return this._nextDistributionBlock <= latestBlock;
  }
}

export class TokenDistributionHistory {
  private _vault: FixedDecimal;
  private _miningGovernance: FixedDecimal;
  private _block: number;

  public get vault(): FixedDecimal {
    return this._vault;
  }

  public get miningGovernance(): FixedDecimal {
    return this._miningGovernance;
  }

  public get block(): number {
    return this._block;
  }

  constructor(history: ITokenDistributionHistory) {
    this._vault = new FixedDecimal(history.vault, history.vault.split('.')[0].length);
    this._miningGovernance = new FixedDecimal(history.miningGovernance, history.miningGovernance.split('.')[0].length);
    this._block = history.block;
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
