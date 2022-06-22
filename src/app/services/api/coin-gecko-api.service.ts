import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@environments/environment";
import { RestApiService } from "./rest-api.service";

@Injectable({providedIn: 'root'})
export class CoinGeckoApiService extends RestApiService {
  api: string = `${environment.cirrusApi}:${environment.cirrusPort}/api`;

  constructor(
    protected _http: HttpClient,
    protected _router: Router
  ) {
    super(_http, _router);
  }
}
