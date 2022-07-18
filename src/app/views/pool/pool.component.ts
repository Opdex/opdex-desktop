import { TransactionsService } from '@services/platform/transactions.service';
import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { Icons } from '@enums/icons';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _route: ActivatedRoute,
    private _poolFactory: LiquidityPoolFactoryService,
    private _nodeServices: NodeService,
    private _transactionService: TransactionsService
  ) { }

  async ngOnInit(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');

    this.subscription.add(
      this._nodeServices.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          switchMap(_ =>  this._poolFactory.buildLiquidityPool(address)),
          tap(pool => this.pool = pool))
        .subscribe());

    const txs = await this._transactionService.searchTransactionReceipts(new ReceiptSearchRequest(address, this.latestBlock - (5400 * 7)));
    console.log(txs)
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
