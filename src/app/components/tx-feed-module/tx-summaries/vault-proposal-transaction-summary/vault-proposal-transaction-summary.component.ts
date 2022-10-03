import { TransactionsService } from '@services/platform/transactions.service';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { IVaultProposalTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { Icons } from '@enums/icons';

@Component({
  selector: 'opdex-vault-proposal-transaction-summary',
  templateUrl: './vault-proposal-transaction-summary.component.html',
  styleUrls: ['./vault-proposal-transaction-summary.component.scss']
})
export class VaultProposalTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: IVaultProposalTransactionSummary;

  get loading(): boolean {
    return !this.summary
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getVaultProposalTransactionSummary(this.transaction);
  }
}

