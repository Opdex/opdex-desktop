import { ICreateLiquidityPoolLog } from '@interfaces/contract-logs.interface';
import { TokenService } from '@services/platform/token.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Token } from '@models/platform/token';
import { Icons } from 'src/app/enums/icons';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-create-pool-transaction-summary',
  templateUrl: './create-pool-transaction-summary.component.html',
  styleUrls: ['./create-pool-transaction-summary.component.scss']
})
export class CreatePoolTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  icons = Icons;
  pool: LiquidityPool;
  crs: Token;
  src: Token;
  error: string;
  isQuote: boolean;
  eventTypes = [
    TransactionLogTypes.CreateLiquidityPoolLog,
  ]

  get loading(): boolean {
    return !this.error && (!this.pool && (!this.crs && !this.src));
  }

  constructor(
    private _liquidityPoolService: LiquidityPoolService,
    private _tokenService: TokenService
  ) { }

  async ngOnChanges(): Promise<void> {
    this.isQuote = !this.transaction.hash;
    const createEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    if (createEvents[0] === undefined) {
      this.error = 'Oops, something is wrong.';
      return;
    }

    try {
      const log = <ICreateLiquidityPoolLog>createEvents[0].log.data;

      if (this.isQuote) {
        this.src = await this._tokenService.getToken(log.token);
        this.crs = await this._tokenService.getToken('CRS');
      } else {
        this.pool = await this._liquidityPoolService.getLiquidityPool(log.pool);
      }
    } catch {
      this.error = 'Oops, something is wrong.';
    }
  }
}
