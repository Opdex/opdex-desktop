import { FixedDecimal } from "@models/types/fixed-decimal";
import { IHydratedVault } from "@services/api/smart-contracts/vault-api.service";

export class Vault {
  private _vault: string;
  private _token: string;
  private _tokensLocked: FixedDecimal;
  private _tokensUnassigned: FixedDecimal;
  private _tokensProposed: FixedDecimal;
  private _totalPledgeMinimum: FixedDecimal;
  private _totalVoteMinimum: FixedDecimal;
  private _vestingDuration: number;
  private _createdBlock: number;
  private _modifiedBlock: number;

  public get vault(): string {
    return this._vault;
  }

  public get token(): string {
    return this._token;
  }

  public get tokensLocked(): FixedDecimal {
    return this._tokensLocked;
  }

  public get tokensUnassigned(): FixedDecimal {
    return this._tokensUnassigned;
  }

  public get tokensProposed(): FixedDecimal {
    return this._tokensProposed;
  }

  public get totalPledgeMinimum(): FixedDecimal {
    return this._totalPledgeMinimum;
  }

  public get totalVoteMinimum(): FixedDecimal {
    return this._totalVoteMinimum;
  }

  public get vestingDuration(): number {
    return this._vestingDuration;
  }

  public get createdBlock(): number {
    return this._createdBlock;
  }

  public get modifiedBlock(): number {
    return this._modifiedBlock;
  }

  constructor(address: string, vault: IHydratedVault) {
    this._vault = address;
    this._token = vault.token;
    this._tokensLocked = FixedDecimal.FromBigInt(vault.balance, 8);
    this._tokensProposed = FixedDecimal.FromBigInt(vault.totalProposedAmount, 8);
    this._tokensUnassigned = FixedDecimal.FromBigInt(vault.totalSupply, 8);
    this._totalPledgeMinimum = FixedDecimal.FromBigInt(vault.totalPledgeMinimum, 8);
    this._totalVoteMinimum = FixedDecimal.FromBigInt(vault.totalVoteMinimum, 8);
    this._vestingDuration = vault.vestingDuration;
  }
}
