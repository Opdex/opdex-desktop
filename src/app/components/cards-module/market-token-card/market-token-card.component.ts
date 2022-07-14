import { ICurrency } from '@lookups/currencyDetails.lookup';
import { Subscription, tap } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { Component, Input } from '@angular/core';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-market-token-card',
  templateUrl: './market-token-card.component.html',
  styleUrls: ['./market-token-card.component.scss']
})
export class MarketTokenCardComponent {
  @Input() token: Token;
  currency: ICurrency;
  subscription = new Subscription();

  constructor(private _currency: CurrencyService) { }

  ngOnInit(): void {
    this.subscription.add(
      this._currency.selectedCurrency$
        .pipe(tap(currency => this.currency = currency))
        .subscribe());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
