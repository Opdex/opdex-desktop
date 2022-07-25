import { IHydratedProposal } from '@services/api/smart-contracts/vault-api.service';
import { IVaultProposalEntity } from '@interfaces/database.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
export class VaultProposal {
  private _vault: string;
  private _token: string;
  private _proposalId: number;
  private _creator: string;
  private _wallet: string;
  private _amount: FixedDecimal;
  private _description: string;
  private _type: string;
  private _status: string;
  private _expiration: number;
  private _yesAmount: FixedDecimal;
  private _noAmount: FixedDecimal;
  private _pledgeAmount: FixedDecimal;
  private _approved: boolean;
  // private _certificate?: VaultCertificate;
  private _createdBlock: number;

  public get vault(): string {
    return this._vault;
  }

  public get token(): string {
    return this._token;
  }

  public get proposalId(): number {
    return this._proposalId;
  }

  public get creator(): string {
    return this._creator;
  }

  public get wallet(): string {
    return this._wallet;
  }

  public get amount(): FixedDecimal {
    return this._amount;
  }

  public get description(): string {
    return this._description;
  }

  public get type(): string {
    return this._type;
  }

  public get status(): string {
    return this._status;
  }

  public get expiration(): number {
    return this._expiration;
  }

  public get yesAmount(): FixedDecimal {
    return this._yesAmount;
  }

  public get noAmount(): FixedDecimal {
    return this._noAmount;
  }

  public get pledgeAmount(): FixedDecimal {
    return this._pledgeAmount;
  }

  public get approved(): boolean {
    return this._approved;
  }

  // public get certificate(): VaultCertificate {
  //   return this._certificate;
  // }

  public get createdBlock(): number {
    return this._createdBlock;
  }

  public get trackBy(): string {
    const { proposalId, status, expiration, pledgeAmount, yesAmount, noAmount } = this;
    return `${proposalId}-${status}-${expiration}-${pledgeAmount.formattedValue}-${yesAmount.formattedValue}-${noAmount.formattedValue}`;
  }

  public get percentApproved(): FixedDecimal {
    const oneHundred = FixedDecimal.OneHundred(0);
    const zero = FixedDecimal.Zero(0);

    if (this.yesAmount.isZero) return zero;
    if (this.noAmount.isZero) return oneHundred;

    const totalVotes = this.yesAmount.add(this.noAmount);
    const percentageYes = this.yesAmount.divide(totalVotes);

    return oneHundred.multiply(percentageYes);
  }

  constructor(vault: string, token: string, entity: IVaultProposalEntity, hydratedProposal: IHydratedProposal) {
    this._vault = vault;
    this._token = token;
    this._proposalId = entity.proposalId,
    this._creator = entity.creator;
    this._wallet = entity.wallet;
    this._amount = FixedDecimal.FromBigInt(hydratedProposal.amount, 8);
    this._description = entity.description;
    this._type = this._getType(entity.type);
    this._status = this._getStatus(hydratedProposal.status);
    this._expiration = hydratedProposal.expiration;
    this._yesAmount = FixedDecimal.FromBigInt(hydratedProposal.yesAmount, 8);
    this._noAmount = FixedDecimal.FromBigInt(hydratedProposal.noAmount, 8);
    this._pledgeAmount = FixedDecimal.FromBigInt(hydratedProposal.pledgeAmount, 8);
    this._approved = entity.approved === 1;
    this._createdBlock = entity.createdBlock;
    // this._certificate = !!proposal.certificate ? new VaultCertificate(proposal.certificate) : null;
  }

  private _getStatus(status: number): string {
    switch(status) {
      case 1: return 'Pledge';
      case 2: return 'Vote';
      case 3: return 'Complete';
      default: throw Error('Invalid Status');
    }
  }

  private _getType(type: number): string {
    switch(type) {
      case 1: return 'Create';
      case 2: return 'Revoke';
      case 3: return 'TotalPledgeMinimum';
      case 4: return 'TotalVoteMinimum';
      default: throw Error('Invalid Type');
    }
  }
}

export enum ProposalType {
  Create = 1,
  Revoke = 2,
  TotalPledgeMinimum = 3,
  TotalVoteMinimum = 4
}

export enum ProposalStatus {
  Pledge = 1,
  Vote = 2,
  Complete = 3
}
