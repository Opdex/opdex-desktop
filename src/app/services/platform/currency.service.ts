import { UserContextService } from '@services/utility/user-context.service';
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from 'rxjs';
import { ICurrencyPricing } from '@interfaces/coin-gecko.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { CurrencyDetailsLookup, ICurrency } from "@lookups/currencyDetails.lookup";
import { Currencies } from "@enums/currencies";
import { StorageService } from '@services/utility/storage.service';

@Injectable({providedIn: 'root'})
export class CurrencyService {
  private _selectedCurrency: ICurrency;
  private _selectedCurrency$ = new BehaviorSubject<ICurrency>(null);
  private _pricing: ICurrencyPricing;
  private _currencyKey = 'currency';

  constructor(
    private _storage: StorageService,
    private _userContextService: UserContextService
  ) {
    const { userContext } = this._userContextService;
    const currency = userContext.isLoggedIn && userContext.preferences.currency
      ? userContext.preferences.currency
      : this._storage.getLocalStorage<string>(this._currencyKey, false) || Currencies.USD;

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
    const context = this._userContextService.userContext;

    if (context.isLoggedIn) {
      context.preferences.currency = currency.abbreviation;
      this._userContextService.setUserPreferences(context.wallet.address, context.preferences);
    }

    currency.price = new FixedDecimal(this._pricing[currency.abbreviation], 8);
    this._selectedCurrency = currency;
    this._storage.setLocalStorage(this._currencyKey, currency.abbreviation, false);
    this._selectedCurrency$.next(this._selectedCurrency);
  }

  setPricing(values: ICurrencyPricing) {
    this._pricing = values;
    this._selectedCurrency.price = new FixedDecimal(values[this._selectedCurrency.abbreviation], 8);
    this._selectedCurrency$.next(this._selectedCurrency);
  }
}
