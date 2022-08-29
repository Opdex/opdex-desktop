import { TokenService } from '@services/platform/token.service';
import { IApprovalLog } from '@interfaces/contract-logs.interface';
import { Token } from '@models/platform/token';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnChanges } from '@angular/core';
import { Icons } from 'src/app/enums/icons';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { TransactionReceipt } from '@models/platform/transactionReceipt';

@Component({
  selector: 'opdex-allowance-transaction-summary',
  templateUrl: './allowance-transaction-summary.component.html',
  styleUrls: ['./allowance-transaction-summary.component.scss']
})
export class AllowanceTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  token: Token;
  amount: FixedDecimal;
  to: string;
  error: string;
  eventTypes = [
    TransactionLogTypes.ApprovalLog,
  ]

  get loading(): boolean {
    return !this.error && (!this.token || !this.amount || !this.to);
  }

  constructor(private _tokenService: TokenService) { }

  async ngOnChanges(): Promise<void> {
    const approveEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    if (approveEvents[0] === undefined) {
      this.error = 'Unable to read approve allowance transaction.';
      return;
    }

    try {
      const log = <IApprovalLog>approveEvents[0].log.data;

      this.token = await this._tokenService.getToken(approveEvents[0].address);
      this.amount = FixedDecimal.FromBigInt(log.amount, this.token.decimals);
      this.to = log.spender;
    } catch {
      this.error = 'Unable to read approve allowance transaction.'
    }
  }
}
