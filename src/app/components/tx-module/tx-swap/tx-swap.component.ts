import { TokenService } from '@services/platform/token.service';
import { Token } from "@models/platform/token";
import { Component, OnChanges, OnDestroy, Input, Injector } from "@angular/core";
import { FormGroup, FormControl, FormBuilder, Validators } from "@angular/forms";
import { CollapseAnimation } from "@animations/collapse";
import { Icons } from "@enums/icons";
import { PositiveDecimalNumberRegex } from "@lookups/regex.lookup";
import { AllowanceValidation } from "@models/allowance-validation";
import { LiquidityPool } from "@models/platform/liquidity-pool";
import { FixedDecimal } from "@models/types/fixed-decimal";
import { EnvironmentsService } from "@services/utility/environments.service";
import { SwapQuoteService } from "@services/utility/swap-quote.service";
import { Subscription, debounceTime, tap, switchMap, filter } from "rxjs";
import { TxBase } from "../tx-base.component";
import { LiquidityPoolService } from "@services/platform/liquidity-pool.service";

@Component({
  selector: 'opdex-tx-swap',
  templateUrl: './tx-swap.component.html',
  styleUrls: ['./tx-swap.component.scss'],
  animations: [CollapseAnimation]
})
export class TxSwapComponent extends TxBase implements OnChanges, OnDestroy {
  @Input() data: any;
  form: FormGroup;
  tokenIn: Token;
  tokenInMax: FixedDecimal;
  tokenInFiatValue: FixedDecimal;
  tokenInPercentageSelected: string;
  changeTokenIn: boolean;
  tokenOut: Token;
  tokenOutMin: FixedDecimal;
  tokenOutFiatValue: FixedDecimal;
  tokenOutPercentageSelected: string;
  tokenOutFiatPercentageDifference: number;
  priceImpact: number;
  numInPerOneOut: FixedDecimal;
  changeTokenOut: boolean;
  toleranceThreshold: number;
  deadlineThreshold: number;
  deadlineBlock: number;
  allowance: AllowanceValidation;
  showMore: boolean;
  latestBlock: number;
  balanceError: boolean;
  poolIn: LiquidityPool;
  poolOut: LiquidityPool;
  marketFee: FixedDecimal;
  subscription = new Subscription();
  icons = Icons;
  tokenInExact = true;
  showTransactionDetails: boolean = true;

  get tokenInAmount(): FormControl {
    return this.form.get('tokenInAmount') as FormControl;
  }

  get tokenOutAmount(): FormControl {
    return this.form.get('tokenOutAmount') as FormControl;
  }

  constructor(
    private _fb: FormBuilder,
    private _liquidityPoolService: LiquidityPoolService,
    private _env: EnvironmentsService,
    protected _injector: Injector,
    private _tokenService: TokenService
  ) {
    super(_injector);

    this.deadlineThreshold = this.context?.preferences?.deadlineThreshold || 10;
    this.toleranceThreshold = this.context?.preferences?.toleranceThreshold || 5;

    this.form = this._fb.group({
      tokenInAmount: ['', [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
      tokenOutAmount: ['', [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
    });

    this.subscription.add(
      this.tokenInAmount.valueChanges
        .pipe(
          debounceTime(400),
          // distinctUntilChanged(),
          tap(_ => this.tokenInExact = true),
          switchMap((value: string) => this.amountOutQuote(value)),
          switchMap(_ => this.validateBalance()))
        .subscribe());

    this.subscription.add(
      this.tokenOutAmount.valueChanges
        .pipe(
          debounceTime(400),
          // distinctUntilChanged(),
          tap(_ => this.tokenInExact = false),
          switchMap((value: string) => this.amountInQuote(value)),
          switchMap(_ => this.validateBalance()))
        .subscribe());

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          tap(_ => this.calcDeadline(this.deadlineThreshold)),
          filter(_ => !!this.tokenIn && !!this.tokenOut),
          switchMap(_ => this.refreshTokens()),
          switchMap(_ => this.tokenInExact ? this.amountOutQuote(this.tokenInAmount.value) : this.amountInQuote(this.tokenOutAmount.value)),
          switchMap(_ => this.validateBalance()))
        .subscribe());
  }

  ngOnChanges() {
    if (this.data?.pool) {
      this.tokenIn = this.data.pool.crsToken;
      this.tokenOut = this.data.pool.srcToken;
      this.poolIn = this.data.pool;
      this.poolOut = this.data.pool;
    }

    this.marketFee = new FixedDecimal('.003', 3);

    // this._marketService.getMarket()
    //   .pipe(take(1))
    //   .subscribe(market => {
    //     if (!this.tokenIn) this.tokenIn = market.tokens.crs;
    //     this.marketFee = market.transactionFeePercent.multiply(new FixedDecimal('.01', 2));
    //   });
  }

  async selectToken(tokenField: string, token: Token): Promise<void> {
    const isTokenInField = tokenField === 'tokenIn';

    if (isTokenInField) {
      this.changeTokenIn = false;
      this.tokenInPercentageSelected = null;
    } else {
      this.changeTokenOut = false;
      this.tokenOutPercentageSelected = null;
    }

    if (!!token) {
      if (isTokenInField) this.tokenIn = token;
      else this.tokenOut = token;

      this.allowance = null;

      await this.refreshTokens();

      this.tokenInExact
        ? await this.amountOutQuote(this.tokenInAmount.value)
        : await this.amountInQuote(this.tokenOutAmount.value);
    }
  }

  changeToken(tokenField: string): void {
    if (tokenField === 'tokenIn') this.changeTokenIn = true;
    else this.changeTokenOut = true;
  }

  async submit(): Promise<void> {
    this.calcDeadline(this.deadlineThreshold);
    const tokenInAmount = new FixedDecimal(this.tokenInAmount.value, this.tokenIn.decimals);
    const tokenOutAmount = new FixedDecimal(this.tokenOutAmount.value, this.tokenOut.decimals);
    const tokenInMax = this.tokenInExact ? tokenInAmount : this.tokenInMax;
    const tokenOutMin = !this.tokenInExact ? tokenOutAmount : this.tokenOutMin;

    try {
      const quote = await this._tokenService.swapQuote(this.tokenIn.address, this.tokenOut.address, tokenInAmount, tokenOutAmount, tokenInMax, tokenOutMin, this.tokenInExact, this.deadlineBlock);
      this.quote(quote);
    } catch {
      // Todo: Should use error from FN if available
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
  }

  async switch(): Promise<void> {
    const tokenInAmount = this.tokenInAmount.value;
    const tokenOutAmount = this.tokenOutAmount.value;
    const tokenIn = this.tokenIn;
    const tokenOut = this.tokenOut;
    const tokenInPercentageSelection = this.tokenInPercentageSelected;
    const tokenOutPercentageSelection = this.tokenOutPercentageSelected;
    const poolIn = this.poolIn;
    const poolOut = this.poolOut;

    this.tokenIn = tokenOut;
    this.tokenOut = tokenIn;
    this.tokenOutPercentageSelected = tokenInPercentageSelection;
    this.tokenInPercentageSelected = tokenOutPercentageSelection;
    this.poolIn = poolOut;
    this.poolOut = poolIn;

    if (this.tokenInExact) {
      this.tokenInExact = false;
      this.tokenOutAmount.setValue(tokenInAmount, { emitEvent: false });
      await this.amountInQuote(tokenInAmount);
    } else {
      this.tokenInExact = true;
      this.tokenInAmount.setValue(tokenOutAmount, { emitEvent: false });
      await this.amountOutQuote(tokenOutAmount);
    }
  }

  calcTotals(tolerance?: number): void {
    if (tolerance) this.toleranceThreshold = tolerance;
    if (this.toleranceThreshold > 99.99 || this.toleranceThreshold < .01) return;
    if (!this.tokenInAmount.value || !this.tokenInAmount.value) return;
    if (!this.poolIn || !this.poolOut) return;

    const one = FixedDecimal.One(8);
    const negativeOneHundred = FixedDecimal.NegativeOneHundred(8);
    const tokenInAmount = new FixedDecimal(this.tokenInAmount.value, this.tokenIn.decimals);
    const tokenInPrice = new FixedDecimal('0', 8); // this.tokenIn.summary.priceUsd;
    const tokenInTolerance = new FixedDecimal((1 + (this.toleranceThreshold / 100)).toFixed(8), 8);
    const tokenOutAmount = new FixedDecimal(this.tokenOutAmount.value, this.tokenOut.decimals);
    const tokenOutPrice = new FixedDecimal('0', 8); // this.tokenOut.summary.priceUsd;
    const tokenOutTolerancePercentage = new FixedDecimal((this.toleranceThreshold / 100).toFixed(8), 8);
    const tokenOutTolerance = tokenOutAmount.multiply(tokenOutTolerancePercentage);

    this.tokenInMax = tokenInAmount.multiply(tokenInTolerance);
    this.tokenOutMin = tokenOutAmount.subtract(tokenOutTolerance);
    this.tokenInFiatValue = tokenInAmount.multiply(tokenInPrice);
    this.tokenOutFiatValue = tokenOutAmount.multiply(tokenOutPrice);
    this.priceImpact = SwapQuoteService.getPriceImpact(tokenInAmount, this.tokenIn, this.tokenOut, this.poolIn, this.poolOut, this.marketFee);
    this.numInPerOneOut = tokenInAmount.divide(tokenOutAmount);

    const tokenOutFiatPercentageDifference = one.subtract(this.tokenOutFiatValue.divide(this.tokenInFiatValue)).multiply(negativeOneHundred);
    tokenOutFiatPercentageDifference.resize(2);
    this.tokenOutFiatPercentageDifference = parseFloat(tokenOutFiatPercentageDifference.formattedValue);
  }

  toggleShowMore(): void {
    this.showMore = !this.showMore;
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
    if (field === 'amountIn') {
      if (this.tokenInPercentageSelected === value.percentageOption && this.tokenInAmount.value === value.result) {
        return;
      }

      this.tokenOutPercentageSelected = null;
      this.tokenInPercentageSelected = value.percentageOption;
      this.tokenInAmount.setValue(value.result, {emitEvent: true});
    } else {
      if (this.tokenOutPercentageSelected === value.percentageOption && this.tokenOutAmount.value === value.result) {
        return;
      }

      this.tokenOutPercentageSelected = value.percentageOption;
      this.tokenInPercentageSelected = null;
      this.tokenOutAmount.setValue(value.result, {emitEvent: true});
    }
  }

  private resetValues(isAmountInQuote: boolean) {
    // If "isAmountInQuote" reset amountOut or vice versa
    // This lets users put "0" or "." in the AmountOut field, resulting in an "AmountIn" quote
    // Then the AmountOut field is not cleared, maintaining the "0" or "." and the AmountOut is cleared.
    if (isAmountInQuote) this.tokenInAmount.setValue('', { emitEvent: false });
    else this.tokenOutAmount.setValue('', { emitEvent: false });

    this.tokenInMax = null;
    this.tokenInFiatValue = null;
    this.tokenOutMin = null;
    this.tokenOutFiatValue = null;
    this.tokenOutFiatPercentageDifference = null;
    this.priceImpact = null;
  }

  private async amountInQuote(amountOut: string): Promise<boolean> {
    if (!this.tokenIn || !this.tokenOut) return false;

    const amountOutFixed = new FixedDecimal(amountOut, this.tokenOut.decimals);

    if (amountOutFixed.isZero) {
      this.resetValues(true);
      return false;
    }

    try {
      const quote = await this._tokenService.amountInQuote(amountOutFixed, this.tokenIn.address, this.poolIn, this.poolOut);
      if (!quote) return null;

      const result = FixedDecimal.FromBigInt(quote.result, this.tokenIn.decimals);
      this.tokenInAmount.setValue(result.formattedValue, { emitEvent: false });
      this.calcTotals();

      if (this.context.wallet === undefined) return null;
      return await this.validateAllowance();
    } catch (error) {
      console.log(error)
      this.tokenOutAmount.setErrors({ invalidAmountInQuote: true });
      this.resetValues(true);
      return null;
    }

    // const request = new SwapAmountInQuoteRequest(this.tokenOut.address, amountOutFixed);

    // this._platformApi.
    //   .swapAmountInQuote(this.tokenIn.address, request.payload)
    //   .pipe(
    //     catchError(() => {
    //       this.tokenOutAmount.setErrors({ invalidAmountInQuote: true });
    //       this.resetValues(true);
    //       return of();
    //     }),
    //     filter(quote => quote !== null && quote !== undefined),
    //     tap((value: ISwapAmountInQuoteResponse) => this.tokenInAmount.setValue(value.amountIn, { emitEvent: false })),
    //     tap(_ => this.calcTotals()),
    //     filter(_ => this.context.wallet !== undefined),
    //     switchMap(() => this.validateAllowance()));
  }

  private async amountOutQuote(amountIn: string): Promise<boolean> {
    if (!this.tokenIn || !this.tokenOut) return false;

    const amountInFixed = new FixedDecimal(amountIn, this.tokenIn.decimals);

    if (amountInFixed.isZero) {
      this.resetValues(false);
      return false;
    }

    try {
      const quote = await this._tokenService.amountOutQuote(amountInFixed, this.tokenIn.address, this.poolIn, this.poolOut);
      if (!quote) return null;

      const result = FixedDecimal.FromBigInt(quote.result, this.tokenOut.decimals);
      this.tokenOutAmount.setValue(result.formattedValue, { emitEvent: false });
      this.calcTotals();

      if (this.context.wallet === undefined) return null;
      return await this.validateAllowance();
    } catch (error) {
      console.log(error)
      this.tokenInAmount.setErrors({ invalidAmountOutQuote: true });
      this.resetValues(false);
      return null;
    }

    // const request = new SwapAmountOutQuoteRequest(this.tokenIn.address, amountInFixed);

    // return this._platformApi.swapAmountOutQuote(this.tokenOut.address, request.payload)
    //   .pipe(
    //     catchError(() => {
    //       this.tokenInAmount.setErrors({ invalidAmountOutQuote: true });
    //       this.resetValues(false);
    //       return of();
    //     }),
    //     filter(quote => quote !== null && quote !== undefined),
    //     tap((value: ISwapAmountOutQuoteResponse) => this.tokenOutAmount.setValue(value.amountOut, { emitEvent: false })),
    //     tap(_ => this.calcTotals()),
    //     filter(_ => this.context.wallet !== undefined),
    //     switchMap(_ => this.validateAllowance()));
  }

  private async validateAllowance(): Promise<boolean> {
    if (!this.tokenIn || !this.tokenOut || this.tokenIn.address === 'CRS' || !this.context?.wallet || !this.tokenInAmount.value) {
      this.allowance = null;
      return false;
    }

    this.allowance = await this._validateAllowance(this.context.wallet, this._env.contracts.router, this.tokenIn, this.tokenInAmount.value);
    return this.allowance.isApproved;
  }

  private async validateBalance(): Promise<boolean> {
    if (!this.tokenIn || !this.tokenOut || !this.context?.wallet || !this.tokenInAmount.value) {
      return false;
    }

    const amountNeeded = this.tokenInExact
      ? new FixedDecimal(this.tokenInAmount.value, this.tokenIn.decimals)
      : this.tokenInMax;

    const amountAvailable = await this._validateBalance(this.tokenIn, amountNeeded);
    this.balanceError = !amountAvailable;

    return amountAvailable;
  }

  private async refreshTokens(): Promise<LiquidityPool[]> {
    if (!this.tokenIn || !this.tokenOut) return null;

    let tokens = [];

    if (!!this.tokenIn && this.tokenIn.address !== 'CRS') tokens.push(this.tokenIn.address);
    if (!!this.tokenOut && this.tokenOut.address !== 'CRS') tokens.push(this.tokenOut.address);

    const pools = await Promise.all(tokens.map(token =>
      this._liquidityPoolService.buildLiquidityPoolBySrcToken(token)));

    this.poolIn = pools.find(pool => pool.crsToken.address === this.tokenIn.address || pool.srcToken.address === this.tokenIn.address);
    this.poolOut = pools.find(pool => pool.crsToken.address === this.tokenOut.address || pool.srcToken.address === this.tokenOut.address);
    this.tokenIn = this.tokenIn.address === 'CRS' ? this.poolIn.crsToken : this.poolIn.srcToken;
    this.tokenOut = this.tokenOut.address === 'CRS' ? this.poolOut.crsToken : this.poolOut.srcToken;

    return pools;
  }

  destroyContext$(): void {
    this.context$.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroyContext$();
    this.subscription.unsubscribe();
  }
}
