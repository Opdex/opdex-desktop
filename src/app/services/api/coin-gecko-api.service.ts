import { Observable, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Currencies } from '@enums/currencies';
import { RestApiService } from "./rest-api.service";
import { ICurrenciesResponse, IHistoricalPricing } from '@interfaces/coin-gecko.interface';

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

  getHistoricalPrice(date: Date): Observable<IHistoricalPricing> {
    // dd-mm-yyyy
    let formattedDate = `${date.getUTCDate()}-${date.getUTCMonth()+1}-${date.getUTCFullYear()}`;
    return this.get<IHistoricalPricing>(`${this.api}/coins/stratis/history?date=${formattedDate}&localization=false`);
  }
}
