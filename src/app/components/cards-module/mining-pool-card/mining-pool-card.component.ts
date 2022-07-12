import { FixedDecimal } from '@models/types/fixed-decimal';
// import { SidenavService } from '@services/utility/sidenav.service';
import { Component, Input, OnChanges } from '@angular/core';
// import { TransactionView } from '@models/transaction-view';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-mining-pool-card',
  templateUrl: './mining-pool-card.component.html',
  styleUrls: ['./mining-pool-card.component.scss']
})
export class MiningPoolCardComponent implements OnChanges {
  @Input() pool: LiquidityPool;
  miningUsd: FixedDecimal;
  icons = Icons;

  constructor(
    // private _sidebar: SidenavService
  ) { }

  ngOnChanges() {
    if (!!this.pool.miningPool === false) return;

    // this.miningUsd = this.pool.tokens.lp.summary.priceUsd.multiply(this.pool.miningPool.tokensMining);
  }

  // transact(childView: string) {
  //   this._sidebar.openSidenav(TransactionView.mine, {pool: this.pool, child: childView});
  // }
}
