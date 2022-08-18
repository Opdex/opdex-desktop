import { Currencies } from '@enums/currencies';

export class UserContext {
  private _wallet: UserContextWallet;
  private _preferences: UserContextPreferences;
  private _termsAcceptance: UserContextTermsAcceptance;

  public get isLoggedIn(): boolean {
    return !!this._wallet && !!this._wallet.address && !!this._wallet.name;
  }

  public get wallet(): UserContextWallet {
    return this._wallet;
  }

  public get preferences(): UserContextPreferences {
    return this._preferences;
  }

  public get termsAcceptance(): UserContextTermsAcceptance {
    return this._termsAcceptance;
  }

  constructor (wallet?: UserContextWallet, preferences?: UserContextPreferences, termsAcceptance?: UserContextTermsAcceptance) {
    this._wallet = wallet || new UserContextWallet();
    this._preferences = preferences || new UserContextPreferences();
    this._termsAcceptance = termsAcceptance || new UserContextTermsAcceptance();
  }
}

export class UserContextTermsAcceptance {
  acceptedDate: Date;
  acceptedVersion: string;
}

export class UserContextWallet {
  name: string;
  address: string;
}

export class UserContextPreferences {
  theme: string;
  deadlineThreshold: number = 10;
  toleranceThreshold: number = 5;
  currency: Currencies;
}
