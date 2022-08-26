import { IndexerService } from '@services/platform/indexer.service';
import { EnvironmentsService } from '@services/utility/environments.service';
import { Icons } from 'src/app/enums/icons';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Component, Input, OnDestroy } from '@angular/core';
import { Network } from 'src/app/enums/networks';
import { CollapseAnimation } from '@animations/collapse';
import { ITransactionQuoteRequest } from '@interfaces/transaction-quote.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'opdex-tx-receipt',
  templateUrl: './tx-receipt.component.html',
  styleUrls: ['./tx-receipt.component.scss'],
  animations: [CollapseAnimation]
})
export class TxReceiptComponent implements OnDestroy {
  @Input() tx: TransactionReceipt;
  @Input() quote: ITransactionQuoteRequest;
  @Input() showBottomDivider: boolean = false;
  @Input() showTimeAgo: boolean = true;
  @Input() collapsed = true;

  latestBlock: number;
  icons = Icons;
  subscription = new Subscription();

  public get chain() {
    return this._env.network === Network.Mainnet ? 'crs' : 'tcrs';
  }

  public get blocksAgo(): number {
    if (!this.tx?.block?.height || !this.latestBlock) return null;
    return this.latestBlock - this.tx.block.height;
  }

  constructor(
    private _env: EnvironmentsService,
    private _indexerService: IndexerService
  ) {
    this.subscription.add(
      this._indexerService.latestBlock$
        .subscribe(latestBlock => this.latestBlock = latestBlock));
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  copyHandler(event): void {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
