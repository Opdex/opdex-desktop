import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { Injector, OnChanges, OnDestroy } from '@angular/core';
import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { TxBase } from '@components/tx-module/tx-base.component';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';

@Component({
  selector: 'opdex-tx-mine-stop',
  templateUrl: './tx-mine-stop.component.html',
  styleUrls: ['./tx-mine-stop.component.scss']
})
export class TxMineStopComponent extends TxBase implements OnChanges, OnDestroy {
  @Input() data;
  icons = Icons;
  form: FormGroup;
  pool: LiquidityPool;
  subscription = new Subscription();
  fiatValue: FixedDecimal;
  percentageSelected: string;
  balanceError: boolean;

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
  ) {
    super(_injector);

    this.form = this._fb.group({
      amount: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]]
    });

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
          switchMap(_ => this.validateMiningBalance()))
        .subscribe());
  }

  ngOnChanges(): void {
    this.pool = this.data?.pool;
    this.reset();
  }

  async submit(): Promise<void> {
    // const request = new MiningQuote(new FixedDecimal(this.amount.value, this.pool.lpToken.decimals));

    // this._platformApi.stopMiningQuote(this.pool.miningPool.address, request.payload)
    //   .pipe(take(1))
    //   .subscribe((quote: ITransactionQuote) => this.quote(quote),
    //               (error: OpdexHttpError) => this.quoteErrors = error.errors);

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

  private setFiatValue(amount: FixedDecimal): void {
    // this.fiatValue = this.pool.lpToken.summary.priceUsd.multiply(amount);
    this.fiatValue = FixedDecimal.Zero(8);
  }

  private async validateMiningBalance(): Promise<boolean> {
    if (!this.amount.value || !this.context?.wallet || !this.pool) {
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
