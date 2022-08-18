import { IReceiptLogs } from '@interfaces/full-node.interface';
import { ProposalType, VaultProposal } from '@models/platform/vault-proposal';
import { TokenService } from '@services/platform/token.service';
import { VaultService } from '@services/platform/vault.service';
import { Vault } from '@models/platform/vault';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { Token } from '@models/platform/token';
import { ICompleteVaultProposalLog, ICreateVaultProposalLog, IVaultProposalPledgeLog,
  IVaultProposalWithdrawPledgeLog, IVaultProposalVoteLog, IVaultProposalWithdrawVoteLog } from '@interfaces/contract-logs.interface';

interface IVaultProposalSummary {
  vault: Vault,
  proposal: VaultProposal;
  pledgeOrVote: IVaultProposalPledgeOrVoteSummary;
  createOrComplete: IVaultProposalCreateOrCompleteSummary;
  crs: Token;
  vaultToken: Token;
  proposalId: number;
}

interface IVaultProposalPledgeOrVoteSummary {
  amount: FixedDecimal;
  withdrawal: boolean;
  inFavor?: boolean;
}

interface IVaultProposalCreateOrCompleteSummary {
  type?: string;
  approved?: boolean;
  amount?: FixedDecimal;
}

@Component({
  selector: 'opdex-vault-proposal-transaction-summary',
  templateUrl: './vault-proposal-transaction-summary.component.html',
  styleUrls: ['./vault-proposal-transaction-summary.component.scss']
})
export class VaultProposalTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  error: string;
  summary: IVaultProposalSummary;
  pledgeOrVoteEvents: IReceiptLogs[];
  createOrCompleteEvents: IReceiptLogs[];

  pledgeOrVoteEventTypes = [
    TransactionLogTypes.VaultProposalPledgeLog,
    TransactionLogTypes.VaultProposalWithdrawPledgeLog,
    TransactionLogTypes.VaultProposalVoteLog,
    TransactionLogTypes.VaultProposalWithdrawVoteLog
  ];

  createOrCompleteEventTypes = [
    TransactionLogTypes.CreateVaultProposalLog,
    TransactionLogTypes.CompleteVaultProposalLog,
  ];

  constructor(
    private _vaultService: VaultService,
    private _tokenFactory: TokenService
  ) { }

  async ngOnChanges(): Promise<void> {
    this.createOrCompleteEvents = this.transaction.events.filter(event => this.createOrCompleteEventTypes.includes(event.log.event as TransactionLogTypes));
    this.pledgeOrVoteEvents = this.transaction.events.filter(event => this.pledgeOrVoteEventTypes.includes(event.log.event as TransactionLogTypes));

    if (this.createOrCompleteEvents.length > 1 ||
        this.pledgeOrVoteEvents.length > 1 ||
        (this.createOrCompleteEvents.length === 0 && this.pledgeOrVoteEvents.length === 0)) {
      this.error = 'Unable to read vault proposal transaction.';
      return;
    }

    const proposalId = this.createOrCompleteEvents.length > 0
      ? this.createOrCompleteEvents[0].log.data.proposalId
      : this.pledgeOrVoteEvents[0].log.data.proposalId

    const proposal = await this._vaultService.getProposal(proposalId);

    let proposalSummary = { proposal, proposalId } as IVaultProposalSummary;
    proposalSummary = await this.buildPledgeOrVoteSummary(proposalSummary);
    this.summary = await this.buildCreateOrCompleteSummary(proposalSummary);
  }

  private async buildPledgeOrVoteSummary(summary: IVaultProposalSummary): Promise<IVaultProposalSummary> {
    if (this.pledgeOrVoteEvents.length > 0) {
      const pledgeEvent = this.pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalPledgeLog);
      const pledgeLog = pledgeEvent ? <IVaultProposalPledgeLog>pledgeEvent.log.data : undefined;

      const withdrawPledgeEvent = this.pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalWithdrawPledgeLog);
      const withdrawPledgeLog = withdrawPledgeEvent ? <IVaultProposalWithdrawPledgeLog>withdrawPledgeEvent.log.data : undefined;

      const voteEvent = this.pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalVoteLog);
      const voteLog = voteEvent ? <IVaultProposalVoteLog>voteEvent.log.data : undefined;

      const withdrawVoteEvent = this.pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalWithdrawVoteLog);
      const withdrawVoteLog = withdrawVoteEvent ? <IVaultProposalWithdrawVoteLog>withdrawVoteEvent.log.data : undefined;

      const crs = await this._tokenFactory.buildToken('CRS')
      summary.crs = crs;
      summary.pledgeOrVote = { inFavor: null } as IVaultProposalPledgeOrVoteSummary;

      if (pledgeLog || voteLog) {
        summary.pledgeOrVote.inFavor = pledgeLog ? null : voteLog.inFavor;
        summary.pledgeOrVote.amount = pledgeLog
          ? FixedDecimal.FromBigInt(pledgeLog.pledgeAmount, crs.decimals)
          : FixedDecimal.FromBigInt(voteLog.voteAmount, crs.decimals);
      }
      else if (withdrawPledgeLog || withdrawVoteLog) {
        summary.pledgeOrVote.withdrawal = true;
        summary.pledgeOrVote.amount = withdrawPledgeLog
          ? FixedDecimal.FromBigInt(withdrawPledgeLog.withdrawAmount, crs.decimals)
          : FixedDecimal.FromBigInt(withdrawVoteLog.withdrawAmount, crs.decimals);
      }
    }

    return summary;
  }

  private async buildCreateOrCompleteSummary(summary: IVaultProposalSummary): Promise<IVaultProposalSummary> {
    if (this.createOrCompleteEvents.length > 0) {
      const createEvent = this.createOrCompleteEvents.find(event => event.log.event === TransactionLogTypes.CreateVaultProposalLog);
      const completeEvent = this.createOrCompleteEvents.find(event => event.log.event === TransactionLogTypes.CompleteVaultProposalLog);
      const createLog = createEvent ? <ICreateVaultProposalLog>createEvent.log.data : undefined;
      const completeLog = completeEvent ? <ICompleteVaultProposalLog>completeEvent.log.data : undefined;

      const vault = await this._vaultService.getVault();
      const token = await this._tokenFactory.buildToken(vault.token);

      summary.vault = vault
      summary.vaultToken = token;
      summary.createOrComplete = { approved: null };

      if (summary.proposal?.type === 'Create' || createLog?.type === ProposalType.Create) summary.createOrComplete.type = 'New Certificate';
      else if (summary.proposal?.type === 'Revoke' || createLog?.type === ProposalType.Revoke) summary.createOrComplete.type = 'Revoke Certificate';
      else if (summary.proposal?.type === 'TotalPledgeMinimum' || createLog?.type === ProposalType.TotalPledgeMinimum) summary.createOrComplete.type = 'Pledge Change';
      else if (summary.proposal?.type === 'TotalVoteMinimum' || createLog?.type === ProposalType.TotalVoteMinimum) summary.createOrComplete.type = 'Vote Change';

      if (completeLog) summary.createOrComplete.approved = completeLog.approved;
    }

    return summary;
  }
}

