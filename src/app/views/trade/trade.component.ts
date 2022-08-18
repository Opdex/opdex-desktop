import { IndexerService } from '@services/platform/indexer.service';
import { switchMap, filter, tap } from 'rxjs';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit, OnDestroy {
  pool: LiquidityPool;
  subscription = new Subscription();
  view: TransactionView = TransactionView.swap;
  childView: string;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _liquidityPoolService: LiquidityPoolService,
    private _indexerService: IndexerService
  ) {
    this.subscription.add(
      this._route.queryParams.subscribe(async ({view, pool, childView}) => {
        if (view) this.view = view;
        if (pool) this.pool = await this._liquidityPoolService.buildLiquidityPool(pool);
        if (childView) this.childView = childView;
      })
    );
  }

  ngOnInit(): void {
    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          filter(_ => !!this.pool),
          switchMap(_ => this._liquidityPoolService.buildLiquidityPool(this.pool.address)),
          tap(pool => this.pool = pool))
        .subscribe());
  }

  handlePoolSelection(pool: LiquidityPool) {
    this.pool = pool;
    this._updateRoute();
  }

  handleTxOption(view: TransactionView) {
    this.view = view;
    this._updateRoute();
  }

  private _updateRoute(): void {
    this._router.navigate(
      ['/trade'],
      {
        relativeTo: this._route,
        queryParams: { view: this.view, pool: this.pool?.address },
        queryParamsHandling: 'merge'
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
