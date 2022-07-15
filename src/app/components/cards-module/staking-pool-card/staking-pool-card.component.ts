import { Subscription } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
// import { TransactionView } from '@sharedModels/transaction-view';
// import { SidenavService } from '@sharedServices/utility/sidenav.service';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { ICurrency } from '@lookups/currencyDetails.lookup';
;

@Component({
  selector: 'opdex-staking-pool-card',
  templateUrl: './staking-pool-card.component.html',
  styleUrls: ['./staking-pool-card.component.scss']
})
export class StakingPoolCardComponent implements OnInit, OnDestroy {
  @Input() pool: LiquidityPool;
  selectedCurrency: ICurrency;
  icons = Icons;
  // txView = TransactionView;
  subscription = new Subscription();

  constructor(
    private _currency: CurrencyService
    // private _sidebar: SidenavService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._currency.selectedCurrency$
        .subscribe(currency => this.selectedCurrency = currency));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // transact(txView: TransactionView) {
  //   this._sidebar.openSidenav(txView, {pool: this.pool});
  // }
}
