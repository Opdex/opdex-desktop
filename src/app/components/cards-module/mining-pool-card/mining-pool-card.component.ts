import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';
// import { SidenavService } from '@services/utility/sidenav.service';
import { Component, Input, OnChanges } from '@angular/core';
// import { TransactionView } from '@models/transaction-view';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Subscription } from 'rxjs';

@Component({
  selector: 'opdex-mining-pool-card',
  templateUrl: './mining-pool-card.component.html',
  styleUrls: ['./mining-pool-card.component.scss']
})
export class MiningPoolCardComponent implements OnChanges {
  @Input() pool: LiquidityPool;
  selectedCurrency: ICurrency;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _currency: CurrencyService
    // private _sidebar: SidenavService
  ) { }

  ngOnChanges() {
    this.subscription.add(
        this._currency.selectedCurrency$
          .subscribe(currency => this.selectedCurrency = currency));

    if (!!this.pool?.miningPool === false) {
      return;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // transact(childView: string) {
  //   this._sidebar.openSidenav(TransactionView.mine, {pool: this.pool, child: childView});
  // }
}
