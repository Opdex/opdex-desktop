import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { Injector, OnDestroy } from '@angular/core';
import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { TxBase } from '@components/tx-module/tx-base.component';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';

@Component({
  selector: 'opdex-tx-mine-stop',
  templateUrl: './tx-mine-stop.component.html',
  styleUrls: ['./tx-mine-stop.component.scss']
})
export class TxMineStopComponent extends TxBase implements OnDestroy {
  _pool: LiquidityPool;
  icons = Icons;
  form: FormGroup;
  subscription = new Subscription();
  fiatValue: FixedDecimal;
  percentageSelected: string;
  balanceError: boolean;
  selectedCurrency: ICurrency;

  @Input() set pool(pool: LiquidityPool) {
    if (this._pool && pool.address !== this._pool.address) {
      this.reset();
    }

    this._pool = pool;
  };

  get pool(): LiquidityPool {
    return this._pool;
  }

  get amount(): FormControl {
    return this.form.get('amount') as FormControl;
  }

  get percentageOfSupply() {
    const oneHundred = FixedDecimal.OneHundred(8);
    const { miningPool, lpToken } = this.pool;
    if (miningPool.tokensMining.isZero) return oneHundred;
    const outputWeight = new FixedDecimal(this.amount.value, lpToken.decimals);
    return outputWeight.divide(miningPool.tokensMining).multiply(oneHundred);
  }

  constructor(
    private _fb: FormBuilder,
    private _liquidityPoolService: LiquidityPoolService,
    protected _injector: Injector,
    private _currencyService: CurrencyService
  ) {
    super(_injector);

    this.form = this._fb.group({
      amount: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]]
    });

    this.subscription.add(
      this._currencyService.selectedCurrency$
        .pipe(tap(currency => this._setSelectedCurrency(currency)))
        .subscribe());

    this.subscription.add(
      this.amount.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          map(amount => {
            const amountFixed = new FixedDecimal(amount || '0', this.pool.lpToken.decimals);
            amountFixed.isZero ? this.reset() : this.setFiatValue(amountFixed);
            return amountFixed;
          }),
          filter(amount => !!this.context?.isLoggedIn && amount.bigInt > 0),
          switchMap(_ => this.validateMiningBalance()))
        .subscribe());
  }

  async submit(): Promise<void> {
    try {
      const amount = new FixedDecimal(this.amount.value, this.pool.lpToken.decimals);
      const quote = await this._liquidityPoolService.stopMiningQuote(this.pool.miningPool.address, amount);
      this.quote(quote);
    } catch (error) {
      console.log(error);
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
}

  handlePercentageSelect(value: any): void {
    this.percentageSelected = value.percentageOption;
    this.amount.setValue(value.result, {emitEvent: true});
  }

  private _setSelectedCurrency(currency?: ICurrency): void {
    if (!currency) currency = this.selectedCurrency;
    else this.selectedCurrency = currency;

    if (this.pool && this.amount.value) {
      const amount = new FixedDecimal(this.amount.value || '0', this.pool.lpToken.decimals);
      this.setFiatValue(amount);
    }
  }

  private setFiatValue(amount: FixedDecimal): void {
    const lpTokenFiat = this.pool.lpToken.pricing[this.selectedCurrency.abbreviation];
    this.fiatValue = lpTokenFiat.multiply(amount);
  }

  private async validateMiningBalance(): Promise<boolean> {
    if (!this.amount.value || !this.context?.isLoggedIn || !this.pool) {
      return false;
    }

    const amountNeeded = new FixedDecimal(this.amount.value, this.pool.lpToken.decimals);
    const sufficientBalance = await this._validateMiningBalance(this.pool, amountNeeded);

    this.balanceError = !sufficientBalance;

    return sufficientBalance;
  }

  private reset(): void {
    this.form.reset();
    this.fiatValue = null;
    this.balanceError = null;
    this.percentageSelected = null;
  }

  destroyContext$(): void {
    this.context$.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroyContext$();
    this.subscription.unsubscribe();
  }
}
