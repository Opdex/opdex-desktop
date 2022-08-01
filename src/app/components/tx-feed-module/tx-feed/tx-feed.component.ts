import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { NodeService } from '@services/platform/node.service';
import { switchMap } from 'rxjs/operators';
import { Subscription, tap } from 'rxjs';
import { TransactionsService } from '@services/platform/transactions.service';
import { Component, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Icons } from 'src/app/enums/icons';

@Component({
  selector: 'opdex-tx-feed',
  templateUrl: './tx-feed.component.html',
  styleUrls: ['./tx-feed.component.scss']
})
export class TxFeedComponent implements OnChanges, OnDestroy {
  @ViewChild('feedContainer') feedContainer: ElementRef;
  @Input() transactionsRequest: ReceiptSearchRequest;
  @Input() size: 's' | 'm' | 'l';
  copied: boolean;
  icons = Icons;
  nextPage: string = null;
  cursor: string;
  subscription: Subscription = new Subscription();
  transactions: TransactionReceipt[] = [];
  newTransactions: TransactionReceipt[] = [];
  refreshAvailable: boolean;
  loading = true;
  endReached: boolean;
  killFeed = false;

  constructor(
    private _transactionsService: TransactionsService,
    private _nodeService: NodeService) { }

  ngOnChanges(): void {
    if (this.transactionsRequest) {

      // Todo: Improve this, when on a view who's route changes but the view component doesn't,
      // we need to unsubscribe and clear the current feed, then refresh all based on the new view
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
      this.transactions = [];
      this.newTransactions = [];
      this.loading = true;

      if (this.feedContainer) {
        this.feedContainer.nativeElement.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      }

      this.subscription.add(
        this._nodeService.latestBlock$
          .pipe(
            // tap(_ => this.transactionsRequest.cursor = null), // reset the cursor
            tap(latestBlock => {
              if (this.transactions.length) {
                this.transactionsRequest.updateBlocks(latestBlock);
              }
            }),
            // Todo: Fix bug, first load should use request.fromBlock, subsequent refreshes should be only new unchecked blocks
            switchMap(_ => this.getTransactions()))
          .subscribe((transactions: TransactionReceipt[]) => {
            this.loading = false;
            if (this.transactions.length === 0) {
              this.transactions.push(...transactions);
              return;
            }

            // Filter and find NEW transactions against this.transactions
            // Filter and find NEW transactions against this.newTransactions
            var latestTransactions = transactions
              .filter(tx => this.transactions.find(existing => existing.hash === tx.hash) === undefined)
              .filter(tx => this.newTransactions.find(existing => existing.hash === tx.hash) === undefined);

            // add new transactions to the front of this.newTransactions
            if (latestTransactions.length > 0) {
              this.refreshAvailable = true;
              this.newTransactions.unshift(...latestTransactions);
            }
          }));
    }
  }

  onScroll() {
    this.more();
  }

  refresh() {
    this.transactions.unshift(...this.newTransactions);
    this.newTransactions = [];
    this.feedContainer.nativeElement.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    this.refreshAvailable = false;
  }

  // Todo:
  // -- This component will also need to work with wallet history - smart contract txs => get receipt by tx hash
  // -- Find pool/vault/token address' created block, only go back that far
  // -- If < 10 txs are found, auto get more()
  async getTransactions(): Promise<TransactionReceipt[]> {
    const maxAge = 4200000;
    let transactions = await this._getTransactions();

    // Todo: Fix bug, first load should use request.fromBlock, subsequent refreshes should be only new unchecked blocks -- causes recursive loop
    // Edge case where the last bit will be cut off from max age
    // while (transactions.length < 10 && this.transactionsRequest.fromBlock < maxAge && !this.killFeed) {
    //   this._setMoreRequest();
    //   transactions = await this._getTransactions();
    // }

    return transactions;
  }

  private async _getTransactions(): Promise<TransactionReceipt[]> {
    const transactions = await this._transactionsService.searchTransactionReceipts(this.transactionsRequest);
    return transactions.filter(tx => tx.events.length >= 1 || !tx.success).sort((x, y) => y.block.height - x.block.height);
  }

  private _setMoreRequest(): void {
    const lastBlock = this.transactions.length > 0
      ? this.transactions[this.transactions.length - 1].block.height
      : this.transactionsRequest.fromBlock;

    this.transactionsRequest.updateBlocks(lastBlock - 5400, lastBlock - 1);
  }

  async more(): Promise<void> {
    if (this.endReached) return;
    this._setMoreRequest();

    const transactions = await this._getTransactions();
    this.transactions.push(...transactions);
  }

  toggleRefresh() {
    this.refreshAvailable = !this.refreshAvailable;
  }

  public transactionsTrackBy(index: number, transaction: any) {
    return transaction.hash;
  }

  public transactionLogsTrackBy(index: number, transactionLog: any) {
    return `${index}-${transactionLog.sortOrder}`;
  }

  copyHandler($event) {
    this.copied = true;
    setTimeout(() => this.copied = false, 1000);
  }

  ngOnDestroy() {
    this.killFeed = true;
    this.subscription.unsubscribe();
  }
}
