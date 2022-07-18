import { TokenFactoryService } from '@services/factory/token-factory.service';
import { IApprovalLog } from '@interfaces/contract-logs.interface';
import { Token } from '@models/platform/token';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Icons } from 'src/app/enums/icons';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { take } from 'rxjs/operators';
import { TransactionReceipt } from '@models/platform/transactionReceipt';

@Component({
  selector: 'opdex-allowance-transaction-summary',
  templateUrl: './allowance-transaction-summary.component.html',
  styleUrls: ['./allowance-transaction-summary.component.scss']
})
export class AllowanceTransactionSummaryComponent implements OnChanges, OnDestroy {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  token: Token;
  amount: FixedDecimal;
  to: string;
  subscription = new Subscription();
  error: string;
  eventTypes = [
    TransactionLogTypes.ApprovalLog,
  ]

  constructor(private _tokenService: TokenFactoryService) { }

  ngOnChanges(): void {
    const approveEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.eventType)) as IApprovalLog[];

    if (approveEvents[0] === undefined) {
      this.error = 'Unable to read approve allowance transaction.';
      return;
    }

    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    this.subscription.add(
      this._tokenService.getToken(approveEvents[0].contract)
        .pipe(take(1))
        .subscribe(
          (token: Token) => {
            this.token = token;
            this.amount = new FixedDecimal(approveEvents[0].amount, this.token.decimals);
            this.to = approveEvents[0].spender;
          },
          (error: string) => this.error = 'Unable to read approve allowance transaction.'));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
