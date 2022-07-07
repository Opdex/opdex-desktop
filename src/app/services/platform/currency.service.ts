import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from 'rxjs';
import { ICurrencyPricing } from '@interfaces/coin-gecko.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { CurrencyDetailsLookup, ICurrency } from "@lookups/currencyDetails.lookup";
import { Currencies } from "@enums/currencies";

@Injectable({providedIn: 'root'})
export class CurrencyService {
  private _selectedCurrency: ICurrency = CurrencyDetailsLookup.find(c => c.abbreviation === Currencies.USD);
  private _selectedCurrency$ = new BehaviorSubject<ICurrency>(null);
  private _pricing: ICurrencyPricing

  get selectedCurrency(): ICurrency {
    return this._selectedCurrency;
  }

  get selectedCurrency$(): Observable<ICurrency> {
    return this._selectedCurrency$.asObservable();
  }

  setSelectedCurrency(currency: ICurrency) {
    currency.price = new FixedDecimal(this._pricing[currency.abbreviation], 8);
    this._selectedCurrency = currency;
    this._selectedCurrency$.next(this._selectedCurrency);
  }

  setPricing(values: ICurrencyPricing) {
    this._pricing = values;
    this._selectedCurrency.price = new FixedDecimal(values[this._selectedCurrency.abbreviation], 8);
    this._selectedCurrency$.next(this._selectedCurrency);
  }
}
