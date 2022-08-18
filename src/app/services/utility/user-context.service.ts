import { UserContextTermsAcceptance } from '@models/user-context';
import { UserContext, UserContextPreferences, UserContextWallet } from '@models/user-context';
import { StorageService } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

type WalletData = {
  preferences: UserContextPreferences,
  termsAcceptance: UserContextTermsAcceptance
}

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
    this._context$.next(this._buildUserContext());
  }

  remove(): void {
    this._storage.removeSessionStorage('user');
    this._context = new UserContext();
    this._context$.next(this._buildUserContext());
  }

  getWalletDetails(walletAddress: string): WalletData {
    return this._storage.getLocalStorage<WalletData>(walletAddress, true) || {} as WalletData;
  }

  setUserPreferences(wallet: string, preferences: UserContextPreferences): void {
    const data = {
      preferences,
      // using this.userContext to enforce the user is logged in prior to setting
      termsAcceptance: this.userContext.termsAcceptance
    };

    this._storage.setLocalStorage(wallet, data, true);
    setTimeout(_ => this._context$.next(this._buildUserContext()));
  }

  setTermsAcceptance(wallet: string, termsAcceptance: UserContextTermsAcceptance): void {
    // getting wallet details so we don't overwrite preferences
    // of non-logged in users when accepting terms
    const data = this.getWalletDetails(wallet);
    data.termsAcceptance = termsAcceptance;

    this._storage.setLocalStorage(wallet, data, true);
    setTimeout(_ => this._context$.next(this._buildUserContext()));
  }

  private _buildUserContext(): UserContext {
    const wallet = this._storage.getSessionStorage<UserContextWallet>('user', true);

    let preferences = new UserContextPreferences();
    let termsAcceptance = new UserContextTermsAcceptance();

    if (wallet) {
      const data: WalletData = this._storage.getLocalStorage(wallet.address, true);

      preferences = data?.preferences;
      termsAcceptance = data?.termsAcceptance;
    }

    return new UserContext(wallet, preferences, termsAcceptance);
  }
}
