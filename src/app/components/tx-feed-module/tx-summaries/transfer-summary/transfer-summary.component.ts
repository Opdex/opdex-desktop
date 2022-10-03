import { TransactionsService } from '@services/platform/transactions.service';
import { ITransferTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Icons } from '@enums/icons';

@Component({
  selector: 'opdex-transfer-summary',
  templateUrl: './transfer-summary.component.html',
  styleUrls: ['./transfer-summary.component.scss']
})
export class TransferSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: ITransferTransactionSummary;

  get loading(): boolean {
    return !this.summary;
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getTransferTransactionSummary(this.transaction);
  }
}
