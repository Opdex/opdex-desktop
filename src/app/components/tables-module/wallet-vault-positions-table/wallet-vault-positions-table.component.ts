import { WalletService } from '@services/platform/wallet.service';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';
import { Icons } from '@enums/icons';
import { Vault } from '@models/platform/vault';
import { VaultProposal } from '@models/platform/vault-proposal';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { UserContext } from '@models/user-context';
import { IndexerService } from '@services/platform/indexer.service';
import { VaultService } from '@services/platform/vault.service';
import { UserContextService } from '@services/utility/user-context.service';
import { Subscription, tap, switchMap } from 'rxjs';

type ProposalPosition = {
  proposal: VaultProposal;
  pledgeBalance: FixedDecimal;
  voteBalance: FixedDecimal;
}

@Component({
  selector: 'opdex-wallet-vault-positions-table',
  templateUrl: './wallet-vault-positions-table.component.html',
  styleUrls: ['./wallet-vault-positions-table.component.scss']
})
export class WalletVaultPositionsTableComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @Input() take: number = 10;
  skip = 0;
  latestBlock: number;
  displayedColumns: string[];
  dataSource: MatTableDataSource<ProposalPosition>;
  subscription: Subscription = new Subscription();
  context: UserContext;
  vault: Vault;
  previous: boolean;
  next: boolean;
  icons = Icons;
  loading = true;
  oneHundred = FixedDecimal.OneHundred(0);

  constructor(
    private _vaultService: VaultService,
    private _indexerService: IndexerService,
    private _userContext: UserContextService,
    private _bottomSheet: MatBottomSheet,
    private _router: Router,
    private _walletService: WalletService,
  ) {
    this.dataSource = new MatTableDataSource<ProposalPosition>();
    this.displayedColumns = ['proposalId', 'type', 'pledgeBalance', 'voteBalance', 'expiration', 'actions'];
  }

  ngOnInit() {
    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          switchMap(_ => this._vaultService.getVault()),
          tap(vault => this.vault = vault),
          switchMap(_ => this.getProposals$(this.skip, this.take)))
        .subscribe(_ => this.loading = false));

    this.subscription.add(
      this._userContext.context$
        .subscribe(context => this.context = context));
  }

  openSidebar(childView: string, proposalId: number, withdraw: boolean): void {
    this._router.navigate(['vault/proposal', proposalId], { queryParams: { txView: childView, withdraw }})
  }

  async quoteCompleteProposal(proposalId: number): Promise<void> {
    if (!this.context?.wallet) return;

    const quote = await this._vaultService.completeProposalQuote(proposalId);

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  private async getProposals$(skip: number, take: number): Promise<void> {
    const proposals = await this._vaultService.getProposals(skip, take);

    const positionsResults = await Promise.all(proposals.results.map(proposal => {
      const { address: wallet } = this._userContext.userContext.wallet;

      return Promise.all([
        this._walletService.getVaultPledgePosition(proposal.proposalId, wallet),
        this._walletService.getVaultVotePosition(proposal.proposalId, wallet),
      ])
    }));

    const positions = positionsResults.map((position, index) => {
      return {
        proposal: proposals.results[index],
        pledgeBalance: FixedDecimal.FromBigInt(position[0], 8),
        voteBalance: FixedDecimal.FromBigInt(position[1].balance, 8)
      }
    })

    this.dataSource.data = [...positions];
    this.previous = this.skip > 0 && proposals.count > this.skip;
    this.next = proposals.count > this.take + this.skip;
  }

  async pageChange(isNext: boolean): Promise<void> {
    this.skip = isNext
      ? this.skip + this.take
      : this.skip - this.take;

    await this.getProposals$(this.skip, this.take)
  }

  trackBy(index: number, proposal: ProposalPosition): string {
    return `${index}-${proposal?.proposal?.trackBy}-${proposal?.pledgeBalance?.formattedValue}-${proposal?.voteBalance?.formattedValue}`;
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
