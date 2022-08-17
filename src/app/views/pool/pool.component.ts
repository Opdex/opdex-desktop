import { IndexerService } from '@services/platform/indexer.service';
import { TransactionView } from '@enums/transaction-view';
import { Subscription, switchMap, tap } from 'rxjs';
import { Icons } from '@enums/icons';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {
  pool: LiquidityPool;
  latestBlock: number;
  icons = Icons;
  subscription = new Subscription();
  routerSubscription = new Subscription();

  constructor(
    private _route: ActivatedRoute,
    private _liquidityPoolService: LiquidityPoolService,
    private _indexerService: IndexerService,
    private _router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.init();

    this.routerSubscription.add(
      this._router.events.subscribe((evt) => {
        if (!(evt instanceof NavigationEnd)) return;
        this.init();
      })
    );
  }

  async init(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');

    if (!this.subscription.closed) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          switchMap(_ =>  this._liquidityPoolService.buildLiquidityPool(address)))
        .subscribe(pool => this.pool = pool));
  }

  handleTxOption(view: TransactionView) {
    this._router.navigate(['/trade'], { queryParams: {view: view, pool: this.pool?.address}})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.routerSubscription.unsubscribe();
  }
}
