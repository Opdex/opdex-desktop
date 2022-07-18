import { IBurnLog, IMintLog } from '@interfaces/contract-logs.interface';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-provide-transaction-summary',
  templateUrl: './provide-transaction-summary.component.html',
  styleUrls: ['./provide-transaction-summary.component.scss']
})
export class ProvideTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  isAddition: boolean;
  lptAmount: FixedDecimal;
  crsAmount: FixedDecimal;
  srcAmount: FixedDecimal;
  pool: LiquidityPool;
  error: string;
  transactionSummary: string;
  eventTypes = [
    TransactionLogTypes.MintLog,
    TransactionLogTypes.BurnLog
  ]

  constructor(private _liquidityPoolService: LiquidityPoolFactoryService) { }

  async ngOnChanges(): Promise<void> {
    // Should only be one
    const provideEvents = this.transaction.events
      .filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    if (provideEvents.length > 1 || provideEvents.length === 0) {
      this.error = 'Unable to read provide transaction.';
      return;
    }

    this.pool = await this._liquidityPoolService.buildLiquidityPool(provideEvents[0].address);

    if (provideEvents[0].log.event === TransactionLogTypes.MintLog) {
      const event = provideEvents[0].log.data as IMintLog;
      this.isAddition = true;
      this.lptAmount = FixedDecimal.FromBigInt(event.amountLpt, this.pool.lpToken.decimals);
      this.srcAmount = FixedDecimal.FromBigInt(event.amountSrc, this.pool.srcToken.decimals);
      this.crsAmount = FixedDecimal.FromBigInt(event.amountCrs, this.pool.crsToken.decimals);
    } else {
      const event = provideEvents[0].log.data as IBurnLog;
      this.isAddition = false;
      this.lptAmount = FixedDecimal.FromBigInt(event.amountLpt, this.pool.lpToken.decimals);
      this.srcAmount = FixedDecimal.FromBigInt(event.amountSrc, this.pool.srcToken.decimals);
      this.crsAmount = FixedDecimal.FromBigInt(event.amountCrs, this.pool.crsToken.decimals);
    }
  }
}
