import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Icons } from '@enums/icons';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { NodeService } from '@services/platform/node.service';
import { TransactionsService } from '@services/platform/transactions.service';
import { Subscription, tap, switchMap, filter } from 'rxjs';

@Component({
  selector: 'opdex-contract-feed',
  templateUrl: './contract-feed.component.html',
  styleUrls: ['./contract-feed.component.scss']
})
export class ContractFeedComponent {
  @ViewChild('feedContainer') feedContainer: ElementRef;
  @Input() contract: string;
  transactionsRequest: ReceiptSearchRequest;
  refreshAvailable: boolean;
  latestBlock: number;
  icons = Icons;
  loading = true;
  subscription: Subscription = new Subscription();
  transactions: TransactionReceipt[] = [];
  newTransactions: TransactionReceipt[] = [];
  timeSpan = new FormControl(7);
  timeSpans = [
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '30 Days', value: 30 },
  ]

  constructor(
    private _transactionsService: TransactionsService,
    private _nodeService: NodeService) { }

  ngOnChanges(): void {
    if (this.contract) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
      this.transactions = [];
      this.newTransactions = [];
      this.loading = true;

      if (this.feedContainer) {
        this.feedContainer.nativeElement.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      }

      this.subscription.add(
        this.timeSpan.valueChanges
          .pipe(
            filter(_ => !!this.latestBlock),
            switchMap(value => {
              this.loading = true;
              this.transactions = [];
              this.newTransactions = [];
              const fromBlock = this.latestBlock - (5400 * value)
              this.transactionsRequest = new ReceiptSearchRequest(this.contract, fromBlock);
              return this._getTransactions();
            })
          )
          .subscribe());

      this.subscription.add(
        this._nodeService.latestBlock$
          .pipe(
            tap(latestBlock => {
              this.latestBlock = latestBlock;

              const fromBlock = !this.transactionsRequest
                ? latestBlock - 5400 * this.timeSpan.value
                : latestBlock - 1;

              this.transactionsRequest = new ReceiptSearchRequest(this.contract, fromBlock);
            }),
            switchMap(_ => this._getTransactions()))
          .subscribe());
    }
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

  private async _getTransactions(): Promise<void> {
    const results = await this._transactionsService.searchTransactionReceipts(this.transactionsRequest);
    const transactions = results
      .filter(tx => tx.events.length >= 1 || !tx.success)
      .sort((x, y) => y.block.height - x.block.height);

    if (this.transactions.length === 0) {
      this.transactions.push(...transactions);
      this.loading = false;
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

    this.loading = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
