import { NodeService } from '@services/platform/node.service';
import { TransactionsService } from '@services/platform/transactions.service';
import { filter, switchMap, skip } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { Component, Inject, OnDestroy } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Subscription } from 'rxjs';
import { Icons } from 'src/app/enums/icons';
import { CollapseAnimation } from '@animations/collapse';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { ITransactionQuoteRequest } from '@interfaces/transaction-quote.interface';
import { TransactionQuote } from '@models/platform/transaction-quote';

@Component({
  selector: 'opdex-review-quote',
  templateUrl: './review-quote.component.html',
  styleUrls: ['./review-quote.component.scss'],
  animations: [CollapseAnimation]
})
export class ReviewQuoteComponent implements OnDestroy {
  txHash: string;
  submitting = false;
  quote: TransactionQuote;
  quoteRequest: ITransactionQuoteRequest;
  subscription = new Subscription();
  quoteReceipt: TransactionReceipt;
  showMethodDetails = true;
  showParameterDetails = true;
  latestBlock: number;
  icons = Icons;
  showQrAnyways: boolean;

  methodParametersHelp = {
    title: 'What are method parameters?',
    paragraph: 'Method parameters are pieces of information that are given to the smart contract method so it has everything it needs to know in order to successfully execute the request.'
  }

  methodDetailsHelp = {
    title: 'What are method details?',
    paragraph: 'All Opdex transactions are executed by calling to a smart contract. Method details cover which smart contract to talk to and what functionality the user wants to execute.'
  }

  public constructor(
    public _bottomSheetRef: MatBottomSheetRef<ReviewQuoteComponent>,
    private _transactionsService: TransactionsService,
    private _nodeService: NodeService,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: TransactionQuote
  ) {
    this.quote = this.data;
    // this._transactionsService.setQuoteDrawerStatus(true);

    this.quoteRequest = this.data.txHandoff;
    this.setQuoteReceipt(this.data);

    // this.subscription.add(
    //   this._transactionsService.getBroadcastedTransaction$()
    //     .subscribe(txHash => this.txHash = txHash));

    // this.subscription.add(
    //   this._transactionsService.getMinedTransaction$()
    //     .subscribe(receipt => {
    //       if (this.txHash) return;

    //       const fromAddressMatches = receipt.from === this.quoteRequest.sender;
    //       const toAddressMatches = receipt.to === this.quoteRequest.to;
    //       let matchingEvents = true;

    //       for (var i = 0; i < receipt.events?.length || 0; i++) {
    //         matchingEvents = receipt.events[i].eventType === this.quote.events[i]?.eventType;
    //       }

    //       if (fromAddressMatches && toAddressMatches && matchingEvents) this.txHash = receipt.hash;
    //     }));

    this.subscription.add(
      this._bottomSheetRef.backdropClick()
        .subscribe(_ => this._bottomSheetRef.dismiss(this.txHash)));

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          skip(1),
          tap(block => this.latestBlock = block),
          filter(_ => !!this.txHash === false),
          switchMap(_ => this._transactionsService.replayQuote(this.quote)),
          tap(q => this.quoteRequest = q.txHandoff),
          tap(q => this.setQuoteReceipt(q)))
        .subscribe(rsp => this.quote = rsp)
    )
  }

  private setQuoteReceipt(quote: TransactionQuote): void {
    this.quoteReceipt = quote.receipt;

    if (!this.quoteReceipt.success && !this.showQrAnyways) {
      this.showParameterDetails = false;
      this.showMethodDetails = false;
    }
  }

  public transactionLogsTrackBy(index: number, transactionLog: any) {
    return transactionLog.sortOrder;
  }

  toggleParameterDetails(): void {
    this.showParameterDetails = !this.showParameterDetails;
  }

  toggleMethodDetails(): void {
    this.showMethodDetails = !this.showMethodDetails;
  }

  close(): void {
    this._bottomSheetRef.dismiss(this.txHash);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    // this._transactionsService.setQuoteDrawerStatus(false);
  }
}
