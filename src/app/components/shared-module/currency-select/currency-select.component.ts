import { CurrencyService } from '@services/platform/currency.service';
import { Component } from '@angular/core';
import { CurrencyDetailsLookup } from '@lookups/currencyDetails.lookup';

@Component({
  selector: 'opdex-currency-select',
  templateUrl: './currency-select.component.html',
  styleUrls: ['./currency-select.component.scss']
})
export class CurrencySelectComponent {
  currencies = CurrencyDetailsLookup;
  currency = this.currencies[0];

  constructor(private _currencyService: CurrencyService) { }

  public select(currency: any) {
    this.currency = this.currencies.find(item => item.abbreviation === currency.abbreviation);
    this._currencyService.setSelectedCurrency(currency)
  }
}
