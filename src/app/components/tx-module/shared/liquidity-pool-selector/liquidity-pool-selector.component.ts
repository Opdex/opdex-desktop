import { IndexerService } from '@services/platform/indexer.service';
import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { skip, filter, switchMap } from 'rxjs/operators';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { TransactionView } from '@enums/transaction-view';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';

@Component({
  selector: 'opdex-liquidity-pool-selector',
  templateUrl: './liquidity-pool-selector.component.html',
  styleUrls: ['./liquidity-pool-selector.component.scss']
})
export class LiquidityPoolSelectorComponent implements OnDestroy {
  @Input() pool: LiquidityPool;
  @Input() view: TransactionView;
  @Output() onPoolChange: EventEmitter<LiquidityPool> = new EventEmitter();
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _liquidityPoolsService: LiquidityPoolService,
    private _indexerService: IndexerService
  ) {
    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          skip(1),
          filter(_ => !!this.pool),
          switchMap(_ => this._liquidityPoolsService.getLiquidityPool(this.pool.address)))
        .subscribe((pool: LiquidityPool) => this.pool = pool));
  }

  clearPool(): void {
    this.pool = null;
  }

  selectLiquidityPool(pool: LiquidityPool): void {
    this.pool = pool;
    this.onPoolChange.emit(this.pool);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
