import { Currencies } from '@enums/currencies';

export class UserContext {
  private _wallet: UserContextWallet;
  private _preferences: UserContextPreferences;

  public get wallet(): UserContextWallet {
    return this._wallet;
  }

  public get preferences(): UserContextPreferences {
    return this._preferences;
  }

  constructor (wallet?: UserContextWallet, preferences?: UserContextPreferences) {
    this._wallet = wallet || new UserContextWallet();
    this._preferences = preferences || new UserContextPreferences();
  }
}

export class UserContextWallet {
  name: string;
  address: string;
}

export class UserContextPreferences {
  theme: string = 'light-mode';
  deadlineThreshold: number = 10;
  toleranceThreshold: number = 5;
  currency: Currencies = Currencies.USD;
}
