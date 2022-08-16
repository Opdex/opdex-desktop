import { UserContextTermsAcceptance } from '@models/user-context';
import { UserContextPreferences } from '@models/user-context';
import { EnvironmentsService } from '@services/utility/environments.service';
import { take } from 'rxjs/operators';
import { TermsModalComponent } from '@components/modals-module/terms-modal/terms-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyDetailsLookup } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';
import { ThemeService } from '@services/utility/theme.service';
import { UserContextService } from '@services/utility/user-context.service';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { WalletService } from '@services/platform/wallet.service';
import { Component, OnInit } from '@angular/core';
import { INodeWalletAddressModel } from '@interfaces/full-node.interface';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'opdex-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  walletList: string[];
  addressList: INodeWalletAddressModel[];

  wallet = new FormControl('', [Validators.required]);
  address = new FormControl('', [Validators.required]);

  constructor(
    private _walletService: WalletService,
    private _router: Router,
    private _userContextService: UserContextService,
    private _theme: ThemeService,
    private _currency: CurrencyService,
    private _dialog: MatDialog,
    private _env: EnvironmentsService
  ) { }

  async ngOnInit(): Promise<void> {
    const context = this._userContextService.userContext;

    if (context.wallet.address && this._validateTermsAcceptedVersion(context.termsAcceptance)) {
      this._loginRedirect();
    } else {
      this.walletList = await this._walletService.getWalletList();
    }
  }

  public async selectWallet(event: MatSelectChange): Promise<void> {
    const addresses = await this._walletService.getWalletAddresses(event.value);
    this.address.reset();

    this.addressList = addresses
      .filter(address => address.isUsed)
      .sort((a, b) => b.amountConfirmed - a.amountConfirmed);
  }

  public login():void {
    const { preferences, termsAcceptance } = this._userContextService.getWalletDetails(this.address.value);

    if (!termsAcceptance?.acceptedDate || this._validateTermsAcceptedVersion(termsAcceptance)) {
      this._dialog.open(TermsModalComponent, { width: '500px', data: { walletAddress: this.address.value } })
        .afterClosed()
        .pipe(take(1))
        .subscribe(agreed => {
          if (agreed) this._login(preferences);
        })
    } else {
      this._login(preferences);
    }
  }

  private _login(preferences: UserContextPreferences): void {
    this._userContextService.set(this.wallet.value,  this.address.value);

    if (preferences?.theme) this._theme.setTheme(preferences.theme);
    if (preferences?.currency) this._currency.setSelectedCurrency(CurrencyDetailsLookup.find(currency => currency.abbreviation === preferences.currency));

    this._loginRedirect();
  }

  private _validateTermsAcceptedVersion(termsAcceptance: UserContextTermsAcceptance): boolean {
    return termsAcceptance?.acceptedVersion && this._env.version.compare(termsAcceptance.acceptedVersion) === 1
  }

  private _loginRedirect(): void {
    this._router.navigateByUrl('/');
  }
}
