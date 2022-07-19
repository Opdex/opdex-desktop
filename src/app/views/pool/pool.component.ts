import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { Icons } from '@enums/icons';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { ReceiptSearchRequest } from '@models/cirrusApi/requests/receipt-search.request';

@Component({
  selector: 'opdex-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {
  pool: LiquidityPool;
  latestBlock: number;
  transactionsRequest: ReceiptSearchRequest;
  icons = Icons;
  subscription = new Subscription();
  routerSubscription = new Subscription();

  constructor(
    private _route: ActivatedRoute,
    private _poolFactory: LiquidityPoolFactoryService,
    private _nodeServices: NodeService,
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
      this._nodeServices.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          switchMap(_ =>  this._poolFactory.buildLiquidityPool(address)))
        .subscribe(pool => this.pool = pool));

    this.transactionsRequest = new ReceiptSearchRequest(address, this.latestBlock - 5400)
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.routerSubscription.unsubscribe();
  }
}
