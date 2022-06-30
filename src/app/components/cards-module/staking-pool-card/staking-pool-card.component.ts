import { Component, Input } from '@angular/core';
// import { TransactionView } from '@sharedModels/transaction-view';
// import { SidenavService } from '@sharedServices/utility/sidenav.service';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
;

@Component({
  selector: 'opdex-staking-pool-card',
  templateUrl: './staking-pool-card.component.html',
  styleUrls: ['./staking-pool-card.component.scss']
})
export class StakingPoolCardComponent {
  @Input() pool: LiquidityPool;
  icons = Icons;
  // txView = TransactionView;

  // constructor(private _sidebar: SidenavService) { }

  // transact(txView: TransactionView) {
  //   this._sidebar.openSidenav(txView, {pool: this.pool});
  // }
}
