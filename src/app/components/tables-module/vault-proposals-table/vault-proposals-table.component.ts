import { IndexerService } from '@services/platform/indexer.service';
import { IPagination } from '@interfaces/database.interface';
import { VaultService } from '@services/platform/vault.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Vault } from '@models/platform/vault';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { Component, Input, OnDestroy, ViewChild, OnInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Icons } from 'src/app/enums/icons';
import { VaultProposal } from '@models/platform/vault-proposal';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';
import { Router } from '@angular/router';

@Component({
  selector: 'opdex-vault-proposals-table',
  templateUrl: './vault-proposals-table.component.html',
  styleUrls: ['./vault-proposals-table.component.scss']
})
export class VaultProposalsTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  @Input() take: number = 10;
  skip = 0;
  latestBlock: number;
  displayedColumns: string[];
  dataSource: MatTableDataSource<VaultProposal>;
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
    private _router: Router
  ) {
    this.dataSource = new MatTableDataSource<any>();
    this.displayedColumns = ['proposalId', 'type', 'proposed', 'status', 'minimums', 'progress', 'expiration', 'actions'];
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

  private async getProposals$(skip: number, take: number): Promise<IPagination<VaultProposal>> {
    const result = await this._vaultService.getProposals(skip, take)
    this.dataSource.data = [...result.results];
    this.previous = this.skip > 0 && result.count > this.skip;
    this.next = result.count > this.take + this.skip;
    return result;
  }

  async pageChange(isNext: boolean): Promise<void> {
    this.skip = isNext
      ? this.skip + this.take
      : this.skip - this.take;

    await this.getProposals$(this.skip, this.take)
  }

  trackBy(index: number, proposal: VaultProposal): string {
    return `${index}-${proposal?.trackBy}`;
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
