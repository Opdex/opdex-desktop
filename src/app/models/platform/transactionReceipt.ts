import { IReceiptLogs } from '@interfaces/full-node.interface';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { IContractReceiptResult } from '@interfaces/full-node.interface';
import { ITransactionType, TransactionTypes } from '@lookups/transaction-types.lookup';

export interface IBlock {
  hash: string;
  height: number;
}

export class TransactionReceipt {
  private _hash: string;
  private _from: string;
  private _to: string;
  private _newContractAddress?: string;
  private _gasUsed: number;
  private _block: IBlock;
  private _success: boolean;
  private _error: string;
  private _events: IReceiptLogs[];
  private _transactionType: ITransactionType;
  private _transactionSummary: string;

  public get hash(): string {
    return this._hash;
  }

  public get from(): string {
    return this._from;
  }

  public get to(): string {
    return this._to;
  }

  public get newContractAddress(): string | null {
    return this._newContractAddress;
  }

  public get gasUsed(): number {
    return this._gasUsed;
  }

  public get block(): IBlock {
    return this._block;
  }

  public get success(): boolean {
    return this._success;
  }

  public get error(): string {
    return this._error;
  }

  public get events(): IReceiptLogs[] {
    return this._events;
  }

  public get transactionType(): ITransactionType {
    return this._transactionType;
  }

  public get transactionSummary(): string {
    return this._transactionSummary;
  }

  constructor(receipt: IContractReceiptResult) {
    this._hash = receipt.transactionHash;
    this._from = receipt.from;
    this._to = receipt.to;
    this._newContractAddress = receipt.newContractAddress;
    this._gasUsed = receipt.gasUsed;
    this._block = { height: receipt.blockNumber, hash: receipt.blockHash };
    this._success = receipt.success;
    this._events = receipt.logs;
    this._error = receipt.error;
    this._transactionType = this.findTransactionType();
    this._transactionSummary = this.getTransactionSummary();
  }

  public eventsOfType(eventTypes: TransactionLogTypes[]) {
    return this._events.filter(event => eventTypes.includes(event.log.event as TransactionLogTypes));
  }

  public eventTypeExists(eventType: TransactionLogTypes): boolean {
    return this.eventsOfType([eventType]).length > 0;
  }

  // This can be reduced as TransactionEvent classes are implemented where they map to their associated summary
  private findTransactionType(): ITransactionType {
    const types = TransactionTypes
      .filter(txType => this._events.filter(event => txType.targetEvents.includes(event.log.event as TransactionLogTypes)).length > 0)
      .sort((a, b) => a.eventPriority - b.eventPriority);

    return types.length > 0 ? {...types[0]} : null;
  }

  private getTransactionSummary(): string {
    if (!this.success) return 'Error';

    switch (this.transactionType?.title) {
      case 'Provide': return this.getProvidingSummary();
      case 'Stake': return this.getStakingSummary();
      case 'Mine': return this.getMiningSummary();
      case 'Vault Certificate': return this.getVaultCertificateSummary();
      case 'Ownership': return this.getOwnershipSummary();
      case 'Swap': return 'Swap';
      case 'Create Pool': return 'Create Pool';
      case 'Enable Mining': return 'Enable Mining';
      case 'Distribute': return 'Distribute';
      case 'Permissions': return 'Set Permission';
      case 'Allowance': return 'Approve Allowance';
      case 'Vault Proposal': return this.getVaultProposalSummary();
      default: return 'Unknown';
    }
  }

  private getProvidingSummary(): string {
    return this.eventTypeExists(TransactionLogTypes.MintLog) ? 'Add Liquidity' : 'Remove Liquidity';
  }

  private getStakingSummary(): string {
    if (this.eventTypeExists(TransactionLogTypes.StartStakingLog)) return 'Start Staking';
    else if (this.eventTypeExists(TransactionLogTypes.StopStakingLog)) return 'Stop Staking';
    else return 'Collect Rewards';
  }

  private getMiningSummary(): string {
    if (this.eventTypeExists(TransactionLogTypes.StartMiningLog)) return 'Start Mining';
    else if (this.eventTypeExists(TransactionLogTypes.StopMiningLog)) return 'Stop Mining';
    else return 'Collect Rewards';
  }

  private getOwnershipSummary(): string {
    var isPending = this.eventsOfType([
      TransactionLogTypes.ClaimPendingDeployerOwnershipLog,
      TransactionLogTypes.SetPendingMarketOwnershipLog
    ]).length > 0;

    return isPending ? 'New Pending Owner' : 'Claimed Ownership';
  }

  private getVaultCertificateSummary(): string {
    if (this.eventTypeExists(TransactionLogTypes.CreateVaultCertificateLog)) return 'Create Vault Certificate';
    else if (this.eventTypeExists(TransactionLogTypes.RedeemVaultCertificateLog)) return 'Redeem Vault Certificate';
    else return 'Revoke Vault Certificate';
  }

  private getVaultProposalSummary(): string {
    if (this.eventTypeExists(TransactionLogTypes.CreateVaultProposalLog)) return 'Create Proposal';
    else if (this.eventTypeExists(TransactionLogTypes.CompleteVaultProposalLog)) return 'Complete Proposal';
    else if (this.eventTypeExists(TransactionLogTypes.VaultProposalPledgeLog)) return 'Pledge';
    else if (this.eventTypeExists(TransactionLogTypes.VaultProposalWithdrawPledgeLog)) return 'Withdraw Pledge';
    else if (this.eventTypeExists(TransactionLogTypes.VaultProposalVoteLog)) return 'Vote';
    else if (this.eventTypeExists(TransactionLogTypes.VaultProposalWithdrawVoteLog)) return 'Withdraw Vote';
    else return 'Vault Proposal';
  }
}
