import { Vault } from '@models/ui/vaults/vault';
import { MarketToken } from '@models/ui/tokens/market-token';
import { take } from 'rxjs/operators';
import { IVaultProposalResponseModel } from '@models/platform-api/responses/vaults/vault-proposal-response-model.interface';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TokensService } from '@services/platform/tokens.service';
import { VaultsService } from '@services/platform/vaults.service';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ICompleteVaultProposalEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/complete-vault-proposal-event.interface';
import { ICreateVaultProposalEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/create-vault-proposal-event.interface';
import { IVaultProposalPledgeEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/vault-proposal-pledge-event.interface';
import { IVaultProposalVoteEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/vault-proposal-vote-event.interface';
import { IVaultProposalWithdrawPledgeEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/vault-proposal-withdraw-pledge-event.interface';
import { IVaultProposalWithdrawVoteEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/vault-proposal-withdraw-vote-event.interface';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Observable, of, Subscription } from 'rxjs';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { IVaultProposalBaseEvent } from '@models/platform-api/responses/transactions/transaction-events/vaults/vault-proposal-base-event.interface';
import { Token } from '@models/platform/token';

interface IVaultProposalSummary {
  vault: Vault,
  proposal: IVaultProposalResponseModel;
  pledgeOrVote: IVaultProposalPledgeOrVoteSummary;
  createOrComplete: IVaultProposalCreateOrCompleteSummary;
  crs: Token;
  vaultToken: MarketToken;
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
export class VaultProposalTransactionSummaryComponent implements OnChanges, OnDestroy {
  @Input() transaction: TransactionReceipt;

  error: string;
  summary: IVaultProposalSummary;
  pledgeOrVoteEvents: IVaultProposalBaseEvent[];
  createOrCompleteEvents: IVaultProposalBaseEvent[];
  subscription = new Subscription();

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

  constructor(private _VaultsService: VaultsService, private _tokensService: TokensService) { }

  ngOnChanges() {
    this.createOrCompleteEvents = this.transaction.events.filter(event => this.createOrCompleteEventTypes.includes(event.eventType)) as IVaultProposalBaseEvent[];
    this.pledgeOrVoteEvents = this.transaction.events.filter(event => this.pledgeOrVoteEventTypes.includes(event.eventType)) as IVaultProposalBaseEvent[];

    if (this.createOrCompleteEvents.length > 1 ||
        this.pledgeOrVoteEvents.length > 1 ||
        (this.createOrCompleteEvents.length === 0 && this.pledgeOrVoteEvents.length === 0)) {
      this.error = 'Unable to read vault proposal transaction.';
      return;
    }

    if (!this.subscription.closed) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }

    const proposalId = this.createOrCompleteEvents[0]?.proposalId || this.pledgeOrVoteEvents[0]?.proposalId;
    const vault = this.createOrCompleteEvents[0]?.contract || this.pledgeOrVoteEvents[0]?.contract;

    this.subscription.add(
      this._VaultsService.getProposal(proposalId, vault)
        .pipe(
          catchError(_ => of({} as IVaultProposalResponseModel)),
          map(proposal => { return { proposal } as IVaultProposalSummary }),
          switchMap(summary => this.buildPledgeOrVoteSummary(summary)),
          switchMap(summary => this.buildCreateOrCompleteSummary(summary)))
        .subscribe(summary => this.summary = summary)
    );
  }

  private buildPledgeOrVoteSummary(summary: IVaultProposalSummary): Observable<IVaultProposalSummary> {
    if (this.pledgeOrVoteEvents.length > 0) {
      const pledgeEvent = this.pledgeOrVoteEvents.find(event => event.eventType === TransactionLogTypes.VaultProposalPledgeLog) as IVaultProposalPledgeEvent;
      const withdrawPledgeEvent = this.pledgeOrVoteEvents.find(event => event.eventType === TransactionLogTypes.VaultProposalWithdrawPledgeLog) as IVaultProposalWithdrawPledgeEvent;
      const voteEvent = this.pledgeOrVoteEvents.find(event => event.eventType === TransactionLogTypes.VaultProposalVoteLog) as IVaultProposalVoteEvent;
      const withdrawVoteEvent = this.pledgeOrVoteEvents.find(event => event.eventType === TransactionLogTypes.VaultProposalWithdrawVoteLog) as IVaultProposalWithdrawVoteEvent;

      return this._tokensService.getToken('CRS')
        .pipe(
          take(1),
          map(crs => {
          summary.crs = crs;
          summary.pledgeOrVote = { inFavor: null } as IVaultProposalPledgeOrVoteSummary;

          if (pledgeEvent || voteEvent) {
            summary.pledgeOrVote.inFavor = pledgeEvent ? null : voteEvent.inFavor;
            summary.pledgeOrVote.amount = pledgeEvent
              ? new FixedDecimal(pledgeEvent.pledgeAmount, crs.decimals)
              : new FixedDecimal(voteEvent.voteAmount, crs.decimals);
          }
          else if (withdrawPledgeEvent || withdrawVoteEvent) {
            summary.pledgeOrVote.withdrawal = true;
            summary.pledgeOrVote.amount = withdrawPledgeEvent
              ? new FixedDecimal(withdrawPledgeEvent.withdrawAmount, crs.decimals)
              : new FixedDecimal(withdrawVoteEvent.withdrawAmount, crs.decimals);
          }

          return summary;
        }));
    }

    return of(summary);
  }

  private buildCreateOrCompleteSummary(summary: IVaultProposalSummary): Observable<IVaultProposalSummary> {
    if (this.createOrCompleteEvents.length > 0) {
      const createEvent = this.createOrCompleteEvents.find(event => event.eventType === TransactionLogTypes.CreateVaultProposalLog) as ICreateVaultProposalEvent;
      const completeEvent = this.createOrCompleteEvents.find(event => event.eventType === TransactionLogTypes.CompleteVaultProposalLog) as ICompleteVaultProposalEvent;

      return this._VaultsService.getVault(createEvent?.contract || completeEvent?.contract)
        .pipe(
          tap(vault => summary.vault = vault),
          switchMap(vault => this._tokensService.getMarketToken(vault.token)),
          map(token => {
            summary.vaultToken = token as MarketToken;
            summary.createOrComplete = { approved: null };

            if (summary.proposal?.type === 'Create' || createEvent?.type === 'Create') summary.createOrComplete.type = 'New Certificate';
            else if (summary.proposal?.type === 'Revoke' || createEvent?.type === 'Revoke') summary.createOrComplete.type = 'Revoke Certificate';
            else if (summary.proposal?.type === 'TotalPledgeMinimum' || createEvent?.type === 'TotalPledgeMinimum') summary.createOrComplete.type = 'Pledge Change';
            else if (summary.proposal?.type === 'TotalVoteMinimum' || createEvent?.type === 'TotalVoteMinimum') summary.createOrComplete.type = 'Vote Change';

            if (completeEvent) summary.createOrComplete.approved = completeEvent.approved;

            return summary;
          }));
    }

    return of(summary);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

