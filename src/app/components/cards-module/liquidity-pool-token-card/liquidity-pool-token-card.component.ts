import { ICurrency } from '@lookups/currencyDetails.lookup';
import { Subscription, tap } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Icons } from 'src/app/enums/icons';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-liquidity-pool-token-card',
  templateUrl: './liquidity-pool-token-card.component.html',
  styleUrls: ['./liquidity-pool-token-card.component.scss']
})
export class LiquidityPoolTokenCardComponent implements OnInit, OnDestroy {
  @Input() token: Token;
  @Input() reserves: FixedDecimal;
  @Input() swapRate: FixedDecimal;
  @Input() swapToken: Token;

  currency: ICurrency;
  icons = Icons;
  one = FixedDecimal.One(0);
  subscription = new Subscription();

  constructor(private _currency: CurrencyService) { }

  ngOnInit() {
    this.subscription.add(
      this._currency.selectedCurrency$
        .pipe(tap(currency => this.currency = currency))
        .subscribe());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
