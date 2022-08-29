import { ITransferLog } from '@interfaces/contract-logs.interface';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { Token } from '@models/platform/token';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { TokenService } from '@services/platform/token.service';
import { Icons } from '@enums/icons';

@Component({
  selector: 'opdex-transfer-summary',
  templateUrl: './transfer-summary.component.html',
  styleUrls: ['./transfer-summary.component.scss']
})
export class TransferSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  transferAmount: FixedDecimal;
  token: Token;
  error: string;
  eventType = TransactionLogTypes.TransferLog;

  get loading(): boolean {
    return !this.error && (!this.transferAmount || !this.token);
  }

  constructor(private _tokenService: TokenService) { }

  async ngOnChanges(): Promise<void> {
    try {
      const events = this.transaction.events.filter(event => event.log.event as TransactionLogTypes === this.eventType);

      if (events.length !== 1 || this.transaction.events.length !== 1) {
        this.error = 'Unable to read non-standard token transfer.';
        return;
      }

      const event = events[0];
      const log = <ITransferLog>event.log.data;

      if (!log.amount) {
        this.error = 'Unknown token transfer type.';
        return;
      }

      const token = await this._tokenService.getToken(event.address);

      this.token = token;
      this.transferAmount = FixedDecimal.FromBigInt(log.amount, token.decimals);
    } catch {
      this.error = 'Oops, something went wrong.';
    }
  }
}
