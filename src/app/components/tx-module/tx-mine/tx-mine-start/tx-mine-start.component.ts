import { tap } from 'rxjs';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, Input, Injector, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { TxBase } from '@components/tx-module/tx-base.component';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { AllowanceValidation } from '@models/allowance-validation';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Subscription } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { Icons } from 'src/app/enums/icons';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';

@Component({
  selector: 'opdex-tx-mine-start',
  templateUrl: './tx-mine-start.component.html',
  styleUrls: ['./tx-mine-start.component.scss']
})
export class TxMineStartComponent extends TxBase implements OnDestroy {
  _pool: LiquidityPool;
  form: FormGroup;
  icons = Icons;
  fiatValue: FixedDecimal;
  allowance: AllowanceValidation;
  percentageSelected: string;
  balanceError: boolean;
  selectedCurrency: ICurrency;
  subscription = new Subscription();

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
    const inputWeight = new FixedDecimal(this.amount.value, lpToken.decimals);
    if (miningPool.tokensMining.isZero) return oneHundred;
    return inputWeight.divide(miningPool.tokensMining).multiply(oneHundred);
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
        filter(amount => !!this.context?.wallet && amount.bigInt > 0),
        switchMap(amount => this.getAllowance$(amount.formattedValue)),
        switchMap(_ => this.validateBalance()))
      .subscribe());

    this.subscription.add(
      this._nodeService.latestBlock$
      .pipe(
        filter(_ => !!this.context.wallet),
        switchMap(_ => this.getAllowance$()))
      .subscribe());
  }

  async submit(): Promise<void> {
    try {
      const amount = new FixedDecimal(this.amount.value, this.pool.lpToken.decimals);
      const quote = await this._liquidityPoolService.startMiningQuote(this.pool.miningPool.address, amount);
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

  private async validateBalance(): Promise<boolean> {
    if (!this.amount.value || !this.context?.wallet || !this.pool) {
      return false;
    }

    const amountNeeded = new FixedDecimal(this.amount.value, this.pool.lpToken.decimals);

    const sufficientBalance = await this._validateBalance(this.pool.lpToken, amountNeeded);

    this.balanceError = !sufficientBalance;

    return sufficientBalance;
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

  private async getAllowance$(amount?: string): Promise<AllowanceValidation> {
    amount = amount || this.amount.value;
    const spender = this.pool?.miningPool?.address;
    const token = this.pool?.lpToken;

    this.allowance = await this._validateAllowance(this.context.wallet, spender, token, amount);

    return this.allowance;
  }

  private reset(): void {
    this.form.reset();
    this.fiatValue = null;
    this.allowance = null;
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
