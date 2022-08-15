import { UserContextService } from '@services/utility/user-context.service';
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from 'rxjs';
import { ICurrencyPricing } from '@interfaces/coin-gecko.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { CurrencyDetailsLookup, ICurrency } from "@lookups/currencyDetails.lookup";
import { Currencies } from "@enums/currencies";

@Injectable({providedIn: 'root'})
export class CurrencyService {
  private _selectedCurrency: ICurrency;
  private _selectedCurrency$ = new BehaviorSubject<ICurrency>(null);
  private _pricing: ICurrencyPricing;

  constructor(private _userContext: UserContextService) {
    const { userContext } = this._userContext;
    const currency = userContext.wallet.address && userContext.preferences.currency
      ? userContext.preferences.currency
      : Currencies.USD;
    this._selectedCurrency = CurrencyDetailsLookup.find(c => c.abbreviation === currency);
  }

  get pricing(): ICurrency[] {
    const currencies = [...CurrencyDetailsLookup];
    currencies.map(currency => {
      currency.price = new FixedDecimal(this._pricing[currency.abbreviation], 8);
    })

    return currencies;
  }

  get selectedCurrency(): ICurrency {
    return this._selectedCurrency;
  }

  get selectedCurrency$(): Observable<ICurrency> {
    return this._selectedCurrency$.asObservable();
  }

  setSelectedCurrency(currency: ICurrency) {
    const context = this._userContext.userContext;

    if (context.wallet) {
      context.preferences.currency = currency.abbreviation;
      this._userContext.setUserPreferences(context.wallet.address, context.preferences);
    }

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
