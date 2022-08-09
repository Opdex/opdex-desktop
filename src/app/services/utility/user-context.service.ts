import { UserContext, UserContextPreferences, UserContextWallet } from '@models/user-context';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private _context = this._buildUserContext();
  private _context$ = new BehaviorSubject<UserContext>(this._context);

  constructor(private _storage: StorageService) { }

  get context$(): Observable<UserContext> {
    return this._context$.asObservable();
  }

  get userContext(): UserContext {
    return this._context;
  }

  set(name: string, address: string): void {
    this._storage.setSessionStorage('user', { name, address })
    this._context = this._buildUserContext();
    this._context$.next(this._context)
  }

  remove(): void {
    this._storage.removeSessionStorage('user');
    this._context = new UserContext();
    this._context$.next(this._context);
  }

  setUserPreferences(wallet: string, preferences: UserContextPreferences): void {
    this._storage.setLocalStorage(wallet, preferences, true);
    this._context$.next(this.userContext)
  }

  private _buildUserContext(): UserContext {
    const wallet = this._storage.getSessionStorage<UserContextWallet>('user', true);

    let preferences = new UserContextPreferences();

    if (wallet) {
      preferences = this._storage.getLocalStorage(wallet.address, true);
    }

    return new UserContext(wallet, preferences);
  }
}
