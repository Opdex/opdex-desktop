import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, OnDestroy, Input, Injector } from "@angular/core";
import { FormGroup, FormControl, FormBuilder, Validators } from "@angular/forms";
import { CollapseAnimation } from "@animations/collapse";
import { TxBase } from "@components/tx-module/tx-base.component";
import { Icons } from "@enums/icons";
import { PositiveDecimalNumberRegex } from "@lookups/regex.lookup";
import { AllowanceValidation } from "@models/allowance-validation";
import { LiquidityPool } from "@models/platform/liquidity-pool";
import { Token } from "@models/platform/token";
import { FixedDecimal } from "@models/types/fixed-decimal";
import { EnvironmentsService } from "@services/utility/environments.service";
import { Subscription, debounceTime, distinctUntilChanged, map, filter, switchMap, tap } from "rxjs";

@Component({
  selector: 'opdex-tx-provide-add',
  templateUrl: './tx-provide-add.component.html',
  styleUrls: ['./tx-provide-add.component.scss'],
  animations: [CollapseAnimation]
})
export class TxProvideAddComponent extends TxBase implements OnDestroy {
  @Input() pool: LiquidityPool;
  icons = Icons;
  txHash: string;
  subscription = new Subscription();
  allowance: AllowanceValidation;
  form: FormGroup;
  showMore: boolean = false;
  crsInFiatValue: FixedDecimal;
  srcInFiatValue: FixedDecimal;
  toleranceThreshold = 5;
  deadlineThreshold = 10;
  crsInMin: FixedDecimal;
  srcInMin: FixedDecimal;
  deadlineBlock: number;
  latestSyncedBlock$: Subscription;
  latestBlock: number;
  crsPercentageSelected: string;
  srcPercentageSelected: string;
  crsBalanceError: boolean;
  srcBalanceError: boolean;
  showTransactionDetails: boolean = true;

  get amountCrs(): FormControl {
    return this.form.get('amountCrs') as FormControl;
  }

  get amountSrc(): FormControl {
    return this.form.get('amountSrc') as FormControl;
  }

  get percentageOfSupply() {
    const { reserveCrs, crsToken } = this.pool;
    const crsInput = new FixedDecimal(this.amountCrs.value, crsToken.decimals);
    if (reserveCrs.isZero) return FixedDecimal.OneHundred(8);
    return crsInput.divide(reserveCrs).multiply(FixedDecimal.OneHundred(0));
  }

  constructor(
    private _fb: FormBuilder,
    private _liquidityPoolService: LiquidityPoolService,
    private _env: EnvironmentsService,
    protected _injector: Injector
  ) {
    super(_injector);

    if (this.context?.preferences?.deadlineThreshold) {
      this.deadlineThreshold = this.context.preferences.deadlineThreshold;
    }

    if (this.context?.preferences?.toleranceThreshold) {
      this.toleranceThreshold = this.context.preferences.toleranceThreshold;
    }

    this.form = this._fb.group({
      amountCrs: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
      amountSrc: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
    });

    // Investigate
    // Set CRS amount in (quotes and sets SRC amount)
    // Change SRC amount (quote and change CRS amount)
    // Change CRS amount (12.24999999 to 12.25) registers no change, no re-quote is given.
    // FINDINGS
    // This is because CRS value is manually typed, auto populates SRC value with quote. Change SRC value, auto re-populates CRS from quote.
    // Then changing CRS does not get triggered by DistinctUntilChanged(), it never knew about the auto populated quote changes so it thinks nothing changed.
    //
    // This isn't reproducible 100% of the time, there must be more to it.
    // ----
    // Working as expected - will circle back and remove 2/4/22
    this.subscription.add(
      this.amountCrs.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          map(amount => {
            const amountFixed = new FixedDecimal(amount || '0', this.pool.crsToken.decimals);
            if (amountFixed.isZero) this.reset();
            return amountFixed;
          }),
          filter(amount => amount.bigInt > 0),
          switchMap(amount => this._quoteAmountIn(amount.formattedValue, this.pool?.crsToken)),
          tap(amount => {
            if (amount !== '') this.amountSrc.setValue(amount, { emitEvent: false })
          }),
          tap(_ => this.calcTolerance()),
          filter(_ => !!this.context.wallet),
          switchMap(_ => this.getAllowance()),
          switchMap(_ => this.validateBalances()))
        .subscribe());

    this.subscription.add(
      this.amountSrc.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          map(amount => {
            const amountFixed = new FixedDecimal(amount || '0', this.pool.srcToken.decimals);
            if (amountFixed.isZero) this.reset();
            return amountFixed;
          }),
          filter(amount => amount.bigInt > 0),
          switchMap(amount => this._quoteAmountIn(amount.formattedValue, this.pool?.srcToken)),
          tap(quoteAmount => {
            if (quoteAmount !== '') this.amountCrs.setValue(quoteAmount, { emitEvent: false })
          }),
          tap(_ => this.calcTolerance()),
          filter(_ => !!this.context.wallet),
          switchMap(_ => this.getAllowance()),
          switchMap(_ => this.validateBalances()))
        .subscribe());

    this.latestSyncedBlock$ = this._nodeService.latestBlock$
      .pipe(
        tap(block => this.latestBlock = block),
        tap(_ => this.calcDeadline(this.deadlineThreshold)),
        filter(_ => !!this.context.wallet),
        switchMap(_ => this.getAllowance()),
        switchMap(_ => this.validateBalances()))
      .subscribe();
  }

  ngOnChanges(): void {
    this.reset();
  }

  private async _quoteAmountIn(value: string, tokenIn: Token): Promise<string> {
    if (!tokenIn) throw('Invalid token');
    if (!value || !this.pool.reserveCrs || this.pool.reserveCrs.isZero) return '';

    const amountA = new FixedDecimal(value, tokenIn.decimals);
    const reserveA = tokenIn.isCrs ? this.pool.reserveCrs : this.pool.reserveSrc;
    const reserveB = tokenIn.isCrs ? this.pool.reserveSrc : this.pool.reserveCrs;

    try {
      const result = await this._liquidityPoolService.provideAmountInQuote(amountA, reserveA, reserveB);
      const bigInt = BigInt(result.result);
      return FixedDecimal.FromBigInt(bigInt, tokenIn.isCrs ? this.pool.srcToken.decimals : this.pool.crsToken.decimals).formattedValue;
    } catch (error) {
      console.log(error);

      if (tokenIn.isCrs) this.amountCrs.setErrors({ invalidAmountEquivalent: true });
      else this.amountSrc.setErrors({ invalidAmountEquivalent: true });

      return '';
    }

    // const payload: IAddLiquidityAmountInQuoteRequest = {
    //   amountIn: value,
    //   tokenIn: tokenIn.address
    // };

    // return this._platformApi.quoteAddLiquidity(this.pool.address, payload)
    //   .pipe(
    //     map((response: IProvideAmountInResponse) => response?.amountIn || ''),
    //     catchError(() => {
    //       const isBasedOnCrs = tokenIn.address.toLowerCase() === 'crs';

    //       if (isBasedOnCrs) this.amountCrs.setErrors({ invalidAmountEquivalent: true });
    //       else this.amountSrc.setErrors({ invalidAmountEquivalent: true });

    //       return of('')
    //     }));
  }

  async submit(): Promise<void> {
    // Temporary
    // const walletConflicts = this._env.prevention.wallets.includes(this.context.wallet);
    // const poolConflicts = this._env.prevention.pools.includes(this.pool.address);

    // if (walletConflicts || poolConflicts) {
    //   this.quoteErrors = ['Unexpected error, please try again later or seek support in Discord.'];
    //   return;
    // }

    try {
      this.calcDeadline(this.deadlineThreshold);
      const amountCrs = new FixedDecimal(this.amountCrs.value, this.pool.crsToken.decimals);
      const amountSrc = new FixedDecimal(this.amountSrc.value, this.pool.srcToken.decimals);
      const quote = await this._liquidityPoolService.addLiquidityQuote(this.pool.srcToken.address, amountCrs, amountSrc, this.crsInMin, this.srcInMin, this.deadlineBlock);
      this.quote(quote);
    } catch (error) {
      console.log(error);
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }

    // const request = new AddLiquidityRequest(
    //   new FixedDecimal(this.amountCrs.value, this.pool.crsToken.decimals),
    //   new FixedDecimal(this.amountSrc.value, this.pool.srcToken.decimals),
    //   this.crsInMin,
    //   this.srcInMin,
    //   this.context.wallet,
    //   this.deadlineBlock
    // );

    // this._platformApi
    //   .addLiquidityQuote(this.pool.address, request.payload)
    //     .pipe(take(1))
    //     .subscribe((quote: ITransactionQuote) => this.quote(quote),
    //                (error: OpdexHttpError) => this.quoteErrors = error.errors);
  }

  calcTolerance(tolerance?: number): void {
    if (tolerance) this.toleranceThreshold = tolerance;

    if (this.toleranceThreshold > 99.99 || this.toleranceThreshold < .01) return;
    if (!this.amountCrs.value || !this.amountSrc.value) return;

    const crsInValue = new FixedDecimal(this.amountCrs.value, this.pool.crsToken.decimals);
    const crsMinTolerance = crsInValue.multiply(new FixedDecimal((this.toleranceThreshold / 100).toFixed(8), 8));
    this.crsInMin = crsInValue.subtract(crsMinTolerance);

    const srcInValue = new FixedDecimal(this.amountSrc.value, this.pool.srcToken.decimals);
    const srcMinTolerance = srcInValue.multiply(new FixedDecimal((this.toleranceThreshold / 100).toFixed(8), 8));
    this.srcInMin = srcInValue.subtract(srcMinTolerance);

    const amountCrs = new FixedDecimal(this.amountCrs.value, this.pool.crsToken.decimals);
    // const priceCrs = this.pool.crsToken.summary.priceUsd;
    const priceCrs = FixedDecimal.Zero(8);
    const amountSrc = new FixedDecimal(this.amountSrc.value, this.pool.srcToken.decimals);
    // const priceSrc = this.pool.srcToken.summary.priceUsd;
    const priceSrc = FixedDecimal.Zero(8);

    this.crsInFiatValue = amountCrs.multiply(priceCrs);
    this.srcInFiatValue = amountSrc.multiply(priceSrc);
  }

  toggleShowMore(value: boolean): void {
    this.showMore = value;
  }

  toggleShowTransactionDetails(): void {
    this.showTransactionDetails = !this.showTransactionDetails;
  }

  calcDeadline(minutes: number): void {
    this.deadlineThreshold = minutes;
    const blocks = Math.ceil(60 * minutes / 16);
    this.deadlineBlock = blocks + this.latestBlock;
  }

  handlePercentageSelect(field: string, value: any): void {
    if (field === 'crs') {
      this.crsPercentageSelected = value.percentageOption;
      this.srcPercentageSelected = null;
      this.amountCrs.setValue(value.result, {emitEvent: true});
    } else {
      this.crsPercentageSelected = null;
      this.srcPercentageSelected = value.percentageOption;
      this.amountSrc.setValue(value.result, {emitEvent: true});
    }
  }

  private async validateBalances(): Promise<void> {
    if (!this.pool || !this.context?.wallet) {
      return null;
    }

    const crsNeeded = new FixedDecimal(this.amountCrs.value, this.pool.crsToken.decimals);
    const srcNeeded = new FixedDecimal(this.amountSrc.value, this.pool.srcToken.decimals);

    const crsSufficientBalance = await this.validateBalance(this.pool.crsToken, crsNeeded);
    this.crsBalanceError = !crsSufficientBalance;

    const srcSufficientBalance = await this.validateBalance(this.pool.srcToken, srcNeeded);
    this.srcBalanceError = !srcSufficientBalance;
  }

  private async validateBalance(token: Token, amount: FixedDecimal): Promise<boolean> {
    if (!this.context?.wallet || !this.pool) return false;

    return await this._validateBalance(token, amount);
  }

  private async getAllowance(): Promise<AllowanceValidation> {
    if (!!this.pool === false) return null;

    this.allowance = await this._validateAllowance(this.context.wallet, this._env.contracts.router, this.pool.srcToken, this.amountSrc.value);

    return this.allowance;
  }

  private reset(): void {
    this.form.reset({}, {emitEvent: false});
    this.allowance = null;
    this.crsInFiatValue = null;
    this.srcInFiatValue = null;
    this.crsInMin = null;
    this.srcInMin = null;
    this.crsPercentageSelected = null;
    this.srcPercentageSelected = null;
    this.crsBalanceError = null;
    this.srcBalanceError = null;
  }

  destroyContext$(): void {
    this.context$.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroyContext$();
    this.subscription.unsubscribe();
    if (this.latestSyncedBlock$) this.latestSyncedBlock$.unsubscribe();
  }
}
