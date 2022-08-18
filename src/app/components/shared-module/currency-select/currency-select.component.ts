import { CurrencyService } from '@services/platform/currency.service';
import { Component, OnDestroy } from '@angular/core';
import { CurrencyDetailsLookup } from '@lookups/currencyDetails.lookup';
import { Subscription } from 'rxjs';

@Component({
  selector: 'opdex-currency-select',
  templateUrl: './currency-select.component.html',
  styleUrls: ['./currency-select.component.scss']
})
export class CurrencySelectComponent implements OnDestroy{
  currencies = CurrencyDetailsLookup;
  currency = this.currencies[0];
  subscription = new Subscription();

  constructor(private _currencyService: CurrencyService) {
    this.subscription.add(
      this._currencyService.selectedCurrency$
        .subscribe(currency => this.currency = currency));
  }

  public select(currency: any) {
    this.currency = this.currencies.find(item => item.abbreviation === currency.abbreviation);
    this._currencyService.setSelectedCurrency(currency)
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
