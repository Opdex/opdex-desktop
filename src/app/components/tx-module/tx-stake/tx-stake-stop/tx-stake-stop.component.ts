import { ICurrency } from '@lookups/currencyDetails.lookup';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { OnDestroy } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap, filter, map, tap } from 'rxjs/operators';
import { Component, Input, Injector } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { TxBase } from '@components/tx-module/tx-base.component';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { CurrencyService } from '@services/platform/currency.service';

@Component({
  selector: 'opdex-tx-stake-stop',
  templateUrl: './tx-stake-stop.component.html',
  styleUrls: ['./tx-stake-stop.component.scss']
})
export class TxStakeStopComponent extends TxBase implements OnDestroy {
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

  get liquidate(): FormControl {
    return this.form.get('liquidate') as FormControl;
  }

  get percentageOfSupply() {
    const oneHundred = FixedDecimal.OneHundred(8);
    const { totalStaked, stakingToken } = this.pool;
    if (totalStaked.isZero) return oneHundred;
    const outputWeight = new FixedDecimal(this.amount.value, stakingToken?.decimals);
    return outputWeight.divide(totalStaked).multiply(oneHundred);
  }

  constructor(
    private _fb: FormBuilder,
    protected _injector: Injector,
    private _liquidityPoolService: LiquidityPoolService,
    private _currencyService: CurrencyService
  ) {
    super(_injector);

    this.form = this._fb.group({
      amount: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
      liquidate: [false]
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
            const amountFixed = new FixedDecimal(amount || '0', this.pool.stakingToken.decimals);
            amountFixed.isZero ? this.reset() : this.setFiatValue(amountFixed);
            return amountFixed;
          }),
          filter(amount => !!this.context?.wallet?.address && amount.bigInt > 0),
          switchMap(_ => this.validateStakingBalance()))
        .subscribe());
  }

  async submit(): Promise<void> {
    try {
      const amount = new FixedDecimal(this.amount.value, this.pool.stakingToken.decimals);
      const response = await this._liquidityPoolService.stopStakingQuote(this.pool.address, amount, this.liquidate.value);
      this.quote(response);
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
      const amount = new FixedDecimal(this.amount.value || '0', this.pool.stakingToken.decimals);
      this.setFiatValue(amount);
    }
  }

  private setFiatValue(amount: FixedDecimal): void {
    const stakingTokenFiat = this.pool.stakingToken.pricing[this.selectedCurrency.abbreviation];
    this.fiatValue = stakingTokenFiat.multiply(amount);
  }

  private async validateStakingBalance(): Promise<boolean> {
    if (!this.amount.value || !this.context?.wallet?.address  || !this.pool?.stakingToken) {
      return false;
    }

    const amountNeeded = new FixedDecimal(this.amount.value, this.pool.stakingToken?.decimals);
    const sufficientBalance = await this._validateStakingBalance(this.pool, amountNeeded);

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
