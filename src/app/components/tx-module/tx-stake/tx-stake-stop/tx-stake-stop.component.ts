import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { OnDestroy } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap, filter, map } from 'rxjs/operators';
import { Component, Input, OnChanges, Injector } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { TxBase } from '@components/tx-module/tx-base.component';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';

@Component({
  selector: 'opdex-tx-stake-stop',
  templateUrl: './tx-stake-stop.component.html',
  styleUrls: ['./tx-stake-stop.component.scss']
})
export class TxStakeStopComponent extends TxBase implements OnChanges, OnDestroy {
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
    private _liquidityPoolService: LiquidityPoolService
  ) {
    super(_injector);

    this.form = this._fb.group({
      amount: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
      liquidate: [false]
    });

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
          filter(amount => !!this.context?.wallet && amount.bigInt > 0),
          switchMap(_ => this.validateStakingBalance()))
        .subscribe());
  }

  ngOnChanges(): void {
    this.pool = this.data?.pool;
    this.reset();
  }

  async submit(): Promise<void> {
    // const request = new StopStakingRequest(new FixedDecimal(this.amount.value, this.pool.stakingToken.decimals), this.liquidate.value);

    // this._platformApi
    //   .stopStakingQuote(this.pool.address, request.payload)
    //     .pipe(take(1))
    //     .subscribe((quote: ITransactionQuote) => this.quote(quote),
    //                (error: OpdexHttpError) => this.quoteErrors = error.errors);

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
  private setFiatValue(amount: FixedDecimal): void {
    // const stakingTokenFiat = this.pool.stakingToken?.summary?.priceUsd || FixedDecimal.Zero(8);
    // this.fiatValue = stakingTokenFiat.multiply(amount);
    this.fiatValue = FixedDecimal.Zero(8);
  }

  private async validateStakingBalance(): Promise<boolean> {
    if (!this.amount.value || !this.context?.wallet || !this.pool?.stakingToken) {
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
