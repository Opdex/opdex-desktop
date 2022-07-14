import { CurrencyService } from '@services/platform/currency.service';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { Subscription, tap } from 'rxjs';
import { Token } from '@models/platform/token';
import { TokenFactoryService } from '@services/factory/token-factory.service';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'opdex-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit, OnDestroy {
  tokens: Token[];
  currency: ICurrency;
  subscription = new Subscription();

  constructor(
    private _tokenFactory: TokenFactoryService,
    private _currency: CurrencyService
  ) { }

  async ngOnInit(): Promise<void> {
    this.tokens = await this._tokenFactory.buildTokens();

    this.subscription.add(
      this._currency.selectedCurrency$
        .pipe(tap(currency => this.currency = currency))
        .subscribe())
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
