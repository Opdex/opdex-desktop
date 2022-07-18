import { TokenFactoryService } from '@services/factory/token-factory.service';
import { Icons } from 'src/app/enums/icons';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { Token } from '@models/platform/token';
import { IDistributionLog } from '@interfaces/contract-logs.interface';

@Component({
  selector: 'opdex-distribute-transaction-summary',
  templateUrl: './distribute-transaction-summary.component.html',
  styleUrls: ['./distribute-transaction-summary.component.scss']
})
export class DistributeTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  miningGovernanceAmount: FixedDecimal;
  vaultAmount: FixedDecimal;
  token: Token;
  error: string;
  eventTypes = [
    TransactionLogTypes.DistributionLog
  ]

  constructor(private _tokenService: TokenFactoryService) { }

  async ngOnChanges(): Promise<void> {
    const events = this.transaction.events.filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    if (events.length !== 1) {
      this.error = 'Unable to read distribution transaction.';
      return;
    }

    const event = events[0];
    const token = await this._tokenService.buildToken(event.address);
    const log = <IDistributionLog>event.log.data;

    this.token = token;
    this.miningGovernanceAmount = FixedDecimal.FromBigInt(log.miningAmount, this.token.decimals);
    this.vaultAmount = FixedDecimal.FromBigInt(log.vaultAmount, this.token.decimals);
  }
}
