import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Token } from '@models/platform/token';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Component, Input, OnChanges } from '@angular/core';
import { ISwapLog } from '@interfaces/contract-logs.interface';

@Component({
  selector: 'opdex-swap-transaction-summary',
  templateUrl: './swap-transaction-summary.component.html',
  styleUrls: ['./swap-transaction-summary.component.scss']
})
export class SwapTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  tokenIn: Token;
  tokenOut: Token;
  tokenInAmount: FixedDecimal;
  tokenOutAmount: FixedDecimal;
  error: string;

  get loading(): boolean {
    return !this.error && (!this.tokenIn || !this.tokenOut || !this.tokenInAmount || !this.tokenOutAmount);
  }

  constructor(private _liquidityPoolService: LiquidityPoolService) { }

  async ngOnChanges(): Promise<void> {
    try {
      const swapEvents = this.transaction.events.filter(event => event.log.event === TransactionLogTypes.SwapLog);

      if (swapEvents.length == 0 || swapEvents.length > 2) {
        this.error = 'Unable to read swap transaction.'
        return;
      }

      if (swapEvents.length === 1) {
        const event = swapEvents[0];
        const log = <ISwapLog>swapEvents[0].log.data;
        const pool = await this._liquidityPoolService.getLiquidityPool(event.address);

        if (!pool) {
          this.error = 'Unrecognized liquidity pool.';
          return;
        }

        const crsIn = FixedDecimal.FromBigInt(log.amountCrsIn, 8);

        this.tokenIn = crsIn.isZero ? pool.srcToken : pool.crsToken;
        this.tokenOut = crsIn.isZero ? pool.crsToken : pool.srcToken;

        const tokenInAmount = crsIn.isZero ? log.amountSrcIn : log.amountCrsIn;
        this.tokenInAmount = FixedDecimal.FromBigInt(tokenInAmount, this.tokenIn.decimals);

        const tokenOutAmount = crsIn.isZero ? log.amountCrsOut : log.amountSrcOut;
        this.tokenOutAmount = FixedDecimal.FromBigInt(tokenOutAmount, this.tokenOut.decimals);
      }
      else if (swapEvents.length === 2) {
        const firstEvent = swapEvents[0];
        const firstLog = <ISwapLog>swapEvents[0].log.data;
        const secondEvent = swapEvents[1];
        const secondLog = <ISwapLog>swapEvents[1].log.data;
        const firstPool = await this._liquidityPoolService.getLiquidityPool(firstEvent.address);
        const secondPool = await this._liquidityPoolService.getLiquidityPool(secondEvent.address);

        if (!firstPool || !secondPool) {
          this.error = 'Unrecognized liquidity pools.';
          return;
        }

        this.tokenIn = firstPool.srcToken;
        this.tokenOut = secondPool.srcToken;
        this.tokenInAmount = FixedDecimal.FromBigInt(firstLog.amountSrcIn, this.tokenIn.decimals);
        this.tokenOutAmount = FixedDecimal.FromBigInt(secondLog.amountSrcOut, this.tokenOut.decimals);
      }
    } catch {
      this.error = 'Oops, something went wrong.'
    }
  }
}
