import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, Input, OnChanges, Injector, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { TxBase } from '@components/tx-module/tx-base.component';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { AllowanceValidation } from '@models/allowance-validation';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { EnvironmentsService } from '@services/utility/environments.service';
import { Subscription } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { Icons } from 'src/app/enums/icons';

@Component({
  selector: 'opdex-tx-mine-start',
  templateUrl: './tx-mine-start.component.html',
  styleUrls: ['./tx-mine-start.component.scss']
})
export class TxMineStartComponent extends TxBase implements OnChanges, OnDestroy {
  @Input() data;
  form: FormGroup;
  icons = Icons;
  pool: LiquidityPool;
  allowance$ = new Subscription();
  fiatValue: FixedDecimal;
  allowance: AllowanceValidation;
  allowanceTransaction$ = new Subscription();
  latestSyncedBlock$: Subscription;
  percentageSelected: string;
  balanceError: boolean;

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
    private _env: EnvironmentsService
  ) {
    super(_injector);

    this.form = this._fb.group({
      amount: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]]
    });

    this.allowance$ = this.amount.valueChanges
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
      .subscribe();

    this.latestSyncedBlock$ = this._nodeService.latestBlock$
      .pipe(
        filter(_ => !!this.context.wallet),
        switchMap(_ => this.getAllowance$()))
      .subscribe();
  }

  ngOnChanges(): void {
    this.pool = this.data?.pool;
    this.reset();
  }

  async submit(): Promise<void> {
    // Temporary
    // const walletConflicts = this._env.prevention.wallets.includes(this.context.wallet);
    // const poolConflicts = this._env.prevention.pools.includes(this.pool.address);

    // if (walletConflicts || poolConflicts) {
    //   this.quoteErrors = ['Unexpected error, please try again later or seek support in Discord.'];
    //   return;
    // }

    // const request = new MiningQuote();

    // this._platformApi
    //   .startMiningQuote(this.pool.miningPool.address, request.payload)
    //     .pipe(take(1))
    //     .subscribe((quote: ITransactionQuote) => this.quote(quote),
    //                (error: OpdexHttpError) => this.quoteErrors = error.errors);

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

  private setFiatValue(amount: FixedDecimal): void {
    // this.fiatValue = this.pool.lpToken.summary.priceUsd.multiply(amount);
    this.fiatValue = FixedDecimal.Zero(8);
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
    if (this.allowance$) this.allowance$.unsubscribe();
    if (this.allowanceTransaction$) this.allowanceTransaction$.unsubscribe();
    if (this.latestSyncedBlock$) this.latestSyncedBlock$.unsubscribe();
  }
}
