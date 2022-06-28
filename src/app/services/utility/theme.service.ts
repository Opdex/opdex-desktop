import { UserContextService } from '@services/utility/user-context.service';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from '@services/utility/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme$: BehaviorSubject<string>;
  private themeKey = 'theme';

  constructor(
    private _storage: StorageService,
    private _userContextService: UserContextService
  ) {
    const defaultTheme =
      this._userContextService.userContext?.preferences?.theme ||
      this._storage.getLocalStorage<string>(this.themeKey, false) ||
      'light-mode';

    this.theme$ = new BehaviorSubject(defaultTheme);
  }

  getTheme(): Observable<string> {
    return this.theme$.asObservable();
  }

  setTheme(theme: string): void {
    this._storage.setLocalStorage(this.themeKey, theme, false);
    this.theme$.next(theme);
  }
}
