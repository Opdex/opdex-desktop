import { Observable, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { RestApiService } from "./rest-api.service";
import { IGithubRelease } from '@interfaces/github.interface';

@Injectable({providedIn: 'root'})
export class GitHubApiService extends RestApiService {
  api: string = `https://api.github.com`;

  constructor(
    protected _http: HttpClient,
    protected _router: Router
  ) {
    super(_http, _router);
  }

  getLatestVersion(): Observable<IGithubRelease> {
    return this.get<IGithubRelease>(`${this.api}/repos/opdex/cirrus-desktop/releases/latest`)
      .pipe(catchError(_ => of(undefined)));
  }
}
