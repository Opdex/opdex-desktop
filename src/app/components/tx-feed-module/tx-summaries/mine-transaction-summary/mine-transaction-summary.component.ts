import { TransactionsService } from '@services/platform/transactions.service';
import { IMineTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Icons } from '@enums/icons';

@Component({
  selector: 'opdex-mine-transaction-summary',
  templateUrl: './mine-transaction-summary.component.html',
  styleUrls: ['./mine-transaction-summary.component.scss']
})
export class MineTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: IMineTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getMineTransactionSummary(this.transaction);
  }
}
