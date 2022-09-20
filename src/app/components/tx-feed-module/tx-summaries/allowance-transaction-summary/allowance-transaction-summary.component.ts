import { IAllowanceTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { TransactionsService } from '@services/platform/transactions.service';
import { Component, Input, OnChanges } from '@angular/core';
import { Icons } from 'src/app/enums/icons';
import { TransactionReceipt } from '@models/platform/transactionReceipt';

@Component({
  selector: 'opdex-allowance-transaction-summary',
  templateUrl: './allowance-transaction-summary.component.html',
  styleUrls: ['./allowance-transaction-summary.component.scss']
})
export class AllowanceTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  summary: IAllowanceTransactionSummary;
  icons = Icons;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getAllowanceTransactionSummary(this.transaction);
  }
}
