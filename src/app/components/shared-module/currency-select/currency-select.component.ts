import { CurrencyService } from '@services/platform/currency.service';
import { Currencies, CurrenciesTest } from '@enums/currencies';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'opdex-currency-select',
  templateUrl: './currency-select.component.html',
  styleUrls: ['./currency-select.component.scss']
})
export class CurrencySelectComponent implements OnInit {
  currencies = CurrenciesTest;
  currency = this.currencies[0];

  constructor(private _currencyService: CurrencyService) { }

  ngOnInit(): void { }

  public select(currency: any) {
    console.log(currency)
    this.currency = this.currencies.find(item => item.abbreviation === currency.abbreviation);
    this._currencyService.setSelectedCurrency(Currencies[currency.abbreviation.toUpperCase()])
  }
}
