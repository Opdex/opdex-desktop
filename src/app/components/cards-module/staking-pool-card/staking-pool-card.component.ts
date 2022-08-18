import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { TransactionView } from '@enums/transaction-view';
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
  txView = TransactionView;
  subscription = new Subscription();

  constructor(
    private _currency: CurrencyService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._currency.selectedCurrency$
        .subscribe(currency => this.selectedCurrency = currency));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  transact(view: TransactionView) {
    this._router.navigate(['/trade'], {queryParams: {pool: this.pool.address, view}})
  }
}
