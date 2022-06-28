import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Currencies } from '@enums/currencies';
import { RestApiService } from "./rest-api.service";
import { ICurrenciesResponse } from '@interfaces/coin-gecko.interface';

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
    return this.get(`${this.api}/simple/price?ids=stratis&vs_currencies=${currencies}`);
  }
}
