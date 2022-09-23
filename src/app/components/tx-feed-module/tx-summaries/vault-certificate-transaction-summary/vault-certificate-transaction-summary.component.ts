import { IVaultCertificateTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { TransactionsService } from '@services/platform/transactions.service';
import { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Icons } from '@enums/icons';

@Component({
  selector: 'opdex-vault-certificate-transaction-summary',
  templateUrl: './vault-certificate-transaction-summary.component.html',
  styleUrls: ['./vault-certificate-transaction-summary.component.scss']
})
export class VaultCertificateTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  summary: IVaultCertificateTransactionSummary;

  get loading(): boolean {
    return !this.summary
  }

  constructor(private _transactionService: TransactionsService) { }

  async ngOnChanges(): Promise<void> {
    this.summary = await this._transactionService.getVaultCertificateTransactionSummary(this.transaction);
  }
}
