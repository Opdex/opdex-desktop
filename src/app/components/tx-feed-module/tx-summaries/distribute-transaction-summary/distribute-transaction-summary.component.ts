import { TransactionsService } from '@services/platform/transactions.service';
import { Icons } from 'src/app/enums/icons';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { IDistributeTransactionSummary } from '@interfaces/transaction-summaries.interface';

@Component({
  selector: 'opdex-distribute-transaction-summary',
  templateUrl: './distribute-transaction-summary.component.html',
  styleUrls: ['./distribute-transaction-summary.component.scss']
})
export class DistributeTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: IDistributeTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionsService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionsService.getDistributionTransactionSummary(this.transaction);
  }
}
