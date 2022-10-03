import { TransactionsService } from '@services/platform/transactions.service';
import { Icons } from '@enums/icons';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { IEnableMiningTransactionSummary } from '@interfaces/transaction-summaries.interface';

@Component({
  selector: 'opdex-enable-mining-transaction-summary',
  templateUrl: './enable-mining-transaction-summary.component.html',
  styleUrls: ['./enable-mining-transaction-summary.component.scss']
})
export class EnableMiningTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  summary: IEnableMiningTransactionSummary;
  icons = Icons;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionsService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionsService.getEnableMiningTransactionSummary(this.transaction);
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }
}
