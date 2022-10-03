import { Observable, catchError, of, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Currencies } from '@enums/currencies';
import { RestApiService } from "./rest-api.service";
import { ICurrenciesResponse, IPriceHistory } from '@interfaces/coin-gecko.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';

@Injectable({providedIn: 'root'})
export class CoinGeckoApiService extends RestApiService {
  api: string = `https://api.coingecko.com/api/v3`;

  constructor(
    protected _http: HttpClient,
    protected _router: Router
  ) {
    super(_http, _router);
  }

  getLatestPrice(): Observable<ICurrenciesResponse> {
    const currencies = Object.keys(Currencies).map(key => Currencies[key]);
    return this.get<ICurrenciesResponse>(`${this.api}/simple/price?ids=stratis&vs_currencies=${currencies}`)
      .pipe(catchError(_ => of({ stratis: { usd: 0, eur: 0, gbp: 0, jpy: 0, cny: 0 } })));
  }

  getPriceHistory(currency: Currencies): Observable<IPriceHistory[]> {
    return this.get<any>(`${this.api}/coins/stratis/market_chart?vs_currency=${currency}&days=max&interval=daily`)
      .pipe(map(history => {
        return history.prices.map(day => {
          return {
            unixMilliseconds: day[0],
            date: new Date(day[0]),
            price: new FixedDecimal(day[1], 8)
          };
        });
      }));
  }
}
