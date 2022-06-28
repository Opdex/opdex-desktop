import { Currencies } from '@enums/currencies';
import { Injectable } from "@angular/core";
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { ICurrencyPricing } from '@interfaces/coin-gecko.interface';

@Injectable({providedIn: 'root'})
export class CurrencyService {
  private _selectedCurrency: Currencies;
  private _selectedCurrency$ = new BehaviorSubject<Currencies>(null);
  private _pricing: ICurrencyPricing
  private _pricing$ = new BehaviorSubject<ICurrencyPricing>(null);

  get prices(): ICurrencyPricing {
    return this._pricing;
  }

  get prices$(): Observable<ICurrencyPricing> {
    return this._pricing$.asObservable()
      .pipe(filter(value => !!value));
  }

  get selectedCurrencyPrice(): number {
    return this._pricing[this._selectedCurrency];
  }

  get selectedCurrency(): Currencies {
    return this._selectedCurrency;
  }

  get selectedCurrency$(): Observable<Currencies> {
    return this._selectedCurrency$.asObservable();
  }

  getPrice(currency: Currencies): number {
    return this._pricing[currency];
  }

  setSelectedCurrency(currency: Currencies) {
    this._selectedCurrency = currency;
    this._selectedCurrency$.next(this._selectedCurrency);
  }

  setPricing(values: ICurrencyPricing) {
    this._pricing = values;
    this._pricing$.next(this._pricing);
  }
}
