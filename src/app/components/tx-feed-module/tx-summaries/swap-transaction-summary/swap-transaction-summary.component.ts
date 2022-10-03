import { TransactionsService } from '@services/platform/transactions.service';
import { ISwapTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { Icons } from '@enums/icons';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'opdex-swap-transaction-summary',
  templateUrl: './swap-transaction-summary.component.html',
  styleUrls: ['./swap-transaction-summary.component.scss']
})
export class SwapTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: ISwapTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getSwapTransactionSummary(this.transaction);
  }
}
