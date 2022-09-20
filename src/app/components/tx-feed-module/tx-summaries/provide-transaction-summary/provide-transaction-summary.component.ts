import { Icons } from '@enums/icons';
import { TransactionsService } from '@services/platform/transactions.service';
import { IProvideTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';

@Component({
  selector: 'opdex-provide-transaction-summary',
  templateUrl: './provide-transaction-summary.component.html',
  styleUrls: ['./provide-transaction-summary.component.scss']
})
export class ProvideTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: IProvideTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getProvideTransactionSummary(this.transaction);
  }
}
