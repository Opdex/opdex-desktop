import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { OnDestroy } from '@angular/core';
import { Component, Input, Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TxBase } from '@components/tx-module/tx-base.component';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';

@Component({
  selector: 'opdex-tx-mine-collect',
  templateUrl: './tx-mine-collect.component.html',
  styleUrls: ['./tx-mine-collect.component.scss']
})
export class TxMineCollectComponent extends TxBase implements OnDestroy {
  @Input() pool: LiquidityPool;
  balanceError: boolean;
  subscription = new Subscription();

  constructor(
    private _liquidityPoolService: LiquidityPoolService,
    protected _injector: Injector
  ) {
    super(_injector);

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(switchMap(_ => this.validateMiningBalance()))
        .subscribe());
  }

  async submit(): Promise<void> {
    try {
      const response = await this._liquidityPoolService.collectMiningRewardsQuote(this.pool.miningPool.address);
      this.quote(response);
    } catch (error) {
      console.log(error);
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
  }

  private async validateMiningBalance(): Promise<boolean> {
    if (!!this.pool === false || !this.context?.wallet) return false;

    // Should be mining with at least 1 sat
    const amount = FixedDecimal.FromBigInt(BigInt('1'), this.pool.lpToken.decimals);
    const sufficientBalance = await this._validateMiningBalance(this.pool, amount);

    this.balanceError = !sufficientBalance;

    return sufficientBalance;
  }

  destroyContext$(): void {
    this.context$.unsubscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroyContext$();
  }
}
