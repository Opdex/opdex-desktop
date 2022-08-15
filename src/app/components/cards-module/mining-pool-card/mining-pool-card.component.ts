import { Router } from '@angular/router';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';
import { Component, Input, OnChanges } from '@angular/core';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Subscription } from 'rxjs';
import { TransactionView } from '@enums/transaction-view';

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
    private _currency: CurrencyService,
    private _router: Router
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

  transact(childView: string) {
    this._router.navigate(['/trade'], {queryParams: {pool: this.pool.address, view: TransactionView.mine, childView}})
  }
}
