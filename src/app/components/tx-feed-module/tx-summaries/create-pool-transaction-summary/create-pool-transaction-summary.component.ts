import { TransactionsService } from '@services/platform/transactions.service';
import { Icons } from 'src/app/enums/icons';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { ICreatePoolTransactionSummary } from '@interfaces/transaction-summaries.interface';

@Component({
  selector: 'opdex-create-pool-transaction-summary',
  templateUrl: './create-pool-transaction-summary.component.html',
  styleUrls: ['./create-pool-transaction-summary.component.scss']
})
export class CreatePoolTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: ICreatePoolTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionsService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionsService.getCreatePoolTransactionSummary(this.transaction);
  }
}
