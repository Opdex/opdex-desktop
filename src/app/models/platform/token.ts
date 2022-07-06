import { Icons } from '@enums/icons';
import { ITokenEntity } from '@interfaces/database.interface';

export class Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  sats: BigInt;
  wrappedToken: WrappedToken;

  constructor(entity: ITokenEntity) {
    this.address = entity.address;
    this.name = entity.name;
    this.symbol = entity.symbol;
    this.decimals = entity.decimals;
    this.sats = BigInt('1'.padEnd(entity.decimals+1, '0'));

    if (entity.nativeChain !== 'Cirrus') {
      this.wrappedToken = new WrappedToken({
        chain: entity.nativeChain,
        address: entity.nativeChainAddress,
        // Todo: should validate the ethereum address via checksum (we do but don't mark success)
        validated: true,
        // Validate supported tokens via Cirrus FN API
        trusted: true
      });
    }
  }

  static Crs(): Token {
    return new Token({
      name: 'Cirrus',
      symbol: 'CRS',
      address: 'CRS',
      decimals: 8,
      nativeChain: 'Cirrus'
    })
  }
}

class WrappedToken {
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

  constructor(wrapped: any) {
    this._custodian = wrapped.custodian;
    this._chain = wrapped.chain;
    this._address = wrapped.address;
    this._validated = wrapped.validated;
    this._trusted = wrapped.trusted;
  }
}
