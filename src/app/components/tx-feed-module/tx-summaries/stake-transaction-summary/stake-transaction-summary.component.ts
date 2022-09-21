import { Icons } from '@enums/icons';
import { TransactionsService } from '@services/platform/transactions.service';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { IStakeTransactionSummary } from '@interfaces/transaction-summaries.interface';

@Component({
  selector: 'opdex-stake-transaction-summary',
  templateUrl: './stake-transaction-summary.component.html',
  styleUrls: ['./stake-transaction-summary.component.scss']
})
export class StakeTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: IStakeTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getStakingTransactionSummary(this.transaction);
  }
}
