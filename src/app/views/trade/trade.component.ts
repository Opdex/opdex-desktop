import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnDestroy {
  subscription = new Subscription();
  view: TransactionView = TransactionView.swap;
  pool: LiquidityPool;

  constructor(
    private _route: ActivatedRoute,
    private _liquidityPoolService: LiquidityPoolService
  ) {
    this.subscription.add(
      this._route.queryParams.subscribe(async ({view, pool}) => {
        if (view) this.view = view;
        if (pool) this.pool = await this._liquidityPoolService.buildLiquidityPool(pool);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
