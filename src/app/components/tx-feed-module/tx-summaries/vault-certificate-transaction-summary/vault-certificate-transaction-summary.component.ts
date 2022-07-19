import { Token } from '@models/platform/token';
import { TokenFactoryService } from '@services/factory/token-factory.service';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { EnvironmentsService } from '@services/utility/environments.service';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { IRedeemVaultCertificateLog } from '@interfaces/contract-logs.interface';

@Component({
  selector: 'opdex-vault-certificate-transaction-summary',
  templateUrl: './vault-certificate-transaction-summary.component.html',
  styleUrls: ['./vault-certificate-transaction-summary.component.scss']
})
export class VaultCertificateTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;
  vaultToken: Token;
  amount: FixedDecimal;
  error: string;
  event = TransactionLogTypes.RedeemVaultCertificateLog;

  constructor(
    private _envService: EnvironmentsService,
    private _tokenFactory: TokenFactoryService
  ) { }

  async ngOnChanges(): Promise<void> {
    const event = this.transaction.events.find(event => this.event === event.log.data);
    const log = <IRedeemVaultCertificateLog>event.log.data;

    if (!event) {
      this.error = 'Unable to read redeem certificate transaction.';
      return;
    }

    this.vaultToken = await this._tokenFactory.buildToken(this._envService.contracts.odx);
    this.amount = FixedDecimal.FromBigInt(log.amount, this.vaultToken.decimals);
  }
}
