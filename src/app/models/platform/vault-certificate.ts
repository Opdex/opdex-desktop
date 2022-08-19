import { IVaultCertificateEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';

export class VaultCertificate {
  private _owner: string;
  private _amount: FixedDecimal;
  private _vestingStartBlock: number;
  private _vestingEndBlock: number;
  private _proposalId: number;
  private _redeemed: boolean;
  private _revoked: boolean;

  public get owner(): string {
    return this._owner;
  }

  public get amount(): FixedDecimal {
    return this._amount;
  }

  public get vestingStartBlock(): number {
    return this._vestingStartBlock;
  }

  public get vestingEndBlock(): number {
    return this._vestingEndBlock;
  }

  public get proposalId(): number {
    return this._proposalId;
  }

  public get redeemed(): boolean {
    return this._redeemed;
  }

  public get revoked(): boolean {
    return this._revoked;
  }

  public get trackBy(): string {
    const { owner, amount, vestingEndBlock, redeemed, revoked } = this;
    return `${owner}-${amount.formattedValue}-${vestingEndBlock}-${redeemed}-${revoked}`
  }

  constructor(certificate: IVaultCertificateEntity) {
    this._owner = certificate.owner;
    this._amount = FixedDecimal.FromBigInt(certificate.amount, 8);
    this._vestingStartBlock = certificate.createdBlock;
    this._vestingEndBlock = certificate.vestedBlock;
    this._proposalId = certificate.proposalId;
    this._redeemed = certificate.redeemed === 1;
    this._revoked = certificate.revoked === 1;
  }
}
