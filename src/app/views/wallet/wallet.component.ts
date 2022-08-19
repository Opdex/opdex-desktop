import { IndexerService } from '@services/platform/indexer.service';
import { TokenService } from '@services/platform/token.service';
import { CurrencyService } from '@services/platform/currency.service';
import { switchMap } from 'rxjs';
import { TransactionView } from '@enums/transaction-view';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { UserContext } from '@models/user-context';
import { Subscription } from 'rxjs';
import { WalletService } from '@services/platform/wallet.service';
import { UserContextService } from '@services/utility/user-context.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { Token } from '@models/platform/token';
import { Icons } from '@enums/icons';
import { CollapseAnimation } from '@animations/collapse';

@Component({
  selector: 'opdex-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
  animations: [CollapseAnimation]
})
export class WalletComponent implements OnInit, OnDestroy {
  context: UserContext;
  showPreferences: boolean = true;
  crs: Token;
  selectedCurrency: ICurrency;
  crsBalance: FixedDecimal;
  crsBalanceValue: FixedDecimal;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _userContextService: UserContextService,
    private _indexerService: IndexerService,
    private _walletService: WalletService,
    private _currencyService: CurrencyService,
    private _tokenService: TokenService,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.context = this._userContextService.userContext;

    this.subscription.add(
      this._currencyService.selectedCurrency$
        .pipe(tap(currency => this._setSelectedCurrency(currency)))
        .subscribe());

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          switchMap(_ => this._setCrsToken()),
          switchMap(_ => this._walletService.getBalance('CRS', this.context.wallet.address)),
          tap(balance => this._setCrsBalance(balance))
        )
        .subscribe()
    )
  }

  handleDeadlineChange(threshold: number): void {
    this.context.preferences.deadlineThreshold = threshold;
    this._userContextService.setUserPreferences(this.context.wallet.address, this.context.preferences);
  }

  handleToleranceChange(threshold: number): void {
    this.context.preferences.toleranceThreshold = threshold;
    this._userContextService.setUserPreferences(this.context.wallet.address, this.context.preferences);
  }

  togglePreferences(): void {
    this.showPreferences = !this.showPreferences;
  }

  private _setCrsBalance(balance: BigInt): void {
    this.crsBalance = FixedDecimal.FromBigInt(balance, 8);

    if (this.selectedCurrency && this.crs) {
      this.crsBalanceValue = this.crsBalance.multiply(this.crs.pricing[this.selectedCurrency.abbreviation])
    }
  }

  private _setSelectedCurrency(currency: ICurrency): void {
    this.selectedCurrency = currency;

    if (this.crsBalance) {
      this._setCrsBalance(this.crsBalance.bigInt);
    }
  }

  private async _setCrsToken(): Promise<void> {
    this.crs = await this._tokenService.getToken('CRS');
  }

  handleTxOption(view: TransactionView) {
    this._router.navigate(['/trade'], { queryParams: {view}})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
