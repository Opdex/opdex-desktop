import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Currencies } from '@enums/currencies';
import { RestApiService } from "./rest-api.service";

@Injectable({providedIn: 'root'})
export class CoinGeckoApiService extends RestApiService {
  api: string = `https://api.coingecko.com/api/v3`;

  constructor(
    protected _http: HttpClient,
    protected _router: Router
  ) {
    super(_http, _router);
  }

  getLatestPrice(currency: Currencies) {
    this.get(`${this.api}/simple/price?ids=stratis&vs_currencies=${currency}`);
  }
}
