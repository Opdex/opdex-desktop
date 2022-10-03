import { ExportWalletHistoryModalComponent } from './../../modals-module/export-wallet-history-modal/export-wallet-history-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { IndexerService } from '@services/platform/indexer.service';
import { switchMap, Subscription } from 'rxjs';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { WalletService } from '@services/platform/wallet.service';
import { Icons } from '@enums/icons';
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';

@Component({
  selector: 'opdex-wallet-feed',
  templateUrl: './wallet-feed.component.html',
  styleUrls: ['./wallet-feed.component.scss']
})
export class WalletFeedComponent implements OnInit, OnDestroy {
  @ViewChild('feedContainer') feedContainer: ElementRef;

  context: UserContext;
  refreshAvailable: boolean;
  icons = Icons;
  subscription = new Subscription();
  transactions: TransactionReceipt[] = [];
  newTransactions: TransactionReceipt[] = [];
  refreshing = false;
  endReached = false;
  loading = true;
  skip = 0;

  constructor(
    private _indexerService: IndexerService,
    private _walletService: WalletService,
    private _userContextService: UserContextService,
    private _dialog: MatDialog
  ) { }

  async ngOnInit(): Promise<void> {
    this.context = this._userContextService.userContext;

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(switchMap(_ => this._getTransactions()))
        .subscribe());
  }

  refresh() {
    this.transactions.unshift(...this.newTransactions);
    this.newTransactions = [];
    this.feedContainer.nativeElement.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    this.refreshAvailable = false;
  }

  transactionsTrackBy(index: number, transaction: any): string {
    return `${index}-${transaction.hash}`;
  }

  async onScroll(): Promise<void> {
    this.refreshing = true;
    await this._getTransactions(this.skip);
    this.refreshing = false;
  }

  private async _getTransactions(skip: number = 0): Promise<void> {
    const take = 10;
    const results = await this._walletService.getWalletHistory(this.context, skip, take);
    const transactions = results
      .filter(tx => tx.events.length >= 1 || !tx.success)
      .sort((x, y) => y.block.height - x.block.height);

    // No new transactions
    if (transactions.length === 0) {
      this.endReached = true;
      this.loading = false;
      return;
    }

    // First load transactions
    if (this.transactions.length === 0) {
      this.transactions.push(...transactions);
      this.skip = this.transactions.length;
      this.loading = false;
      return;
    }

    // Filter and find NEW transactions against this.transactions
    // Filter and find NEW transactions against this.newTransactions
    var latestTransactions = transactions
      .filter(tx => this.transactions.find(existing => existing.hash === tx.hash) === undefined)
      .filter(tx => this.newTransactions.find(existing => existing.hash === tx.hash) === undefined);

    if (latestTransactions.length > 0) {
      if (this.refreshing) {
        this.transactions.push(...latestTransactions);
      } else {
        this.refreshAvailable = true;
        this.newTransactions.unshift(...latestTransactions);
      }
    }

    this.skip = this.transactions.length + this.newTransactions.length;
    this.loading = false;
  }

  exportHistory(): void {
    this._dialog.open(ExportWalletHistoryModalComponent, { width: '500px', disableClose: true });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
