import { ICurrency } from '@lookups/currencyDetails.lookup';
import { Subscription } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { Icons } from 'src/app/enums/icons';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-liquidity-pool-token-card',
  templateUrl: './liquidity-pool-token-card.component.html',
  styleUrls: ['./liquidity-pool-token-card.component.scss']
})
export class LiquidityPoolTokenCardComponent implements OnChanges, OnInit, OnDestroy {
  @Input() token: Token;
  @Input() reserves: FixedDecimal;
  @Input() swapRate: FixedDecimal;
  @Input() swapToken: Token;

  crsPrice: ICurrency;
  tokenPrice: ICurrency;
  icons = Icons;
  one = FixedDecimal.One(0);
  subscription = new Subscription();

  constructor(private _currency: CurrencyService) { }

  ngOnInit() {
    this.subscription.add(
      this._currency.selectedCurrency$
        .subscribe(price => {
          this.crsPrice = price;
          this._calcPrice();
        }));
  }

  ngOnChanges() {
    this._calcPrice();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private _calcPrice(): void {
    if (this.token && !!this.swapRate) {
      if (this.token.address === 'CRS') {
        this.tokenPrice = this.crsPrice;
        return;
      }

      let tokenPrice = {...this.crsPrice};
      tokenPrice.price = tokenPrice.price.multiply(this.swapRate);
      this.tokenPrice = tokenPrice;
    }
  }
}
