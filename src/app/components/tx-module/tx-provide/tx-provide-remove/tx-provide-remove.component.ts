import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, OnChanges, OnDestroy, Input, Injector } from "@angular/core";
import { FormGroup, FormControl, FormBuilder, Validators } from "@angular/forms";
import { CollapseAnimation } from "@animations/collapse";
import { TxBase } from "@components/tx-module/tx-base.component";
import { Icons } from "@enums/icons";
import { PositiveDecimalNumberRegex } from "@lookups/regex.lookup";
import { AllowanceValidation } from "@models/allowance-validation";
import { LiquidityPool } from "@models/platform/liquidity-pool";
import { FixedDecimal } from "@models/types/fixed-decimal";
import { UserContext } from "@models/user-context";
import { EnvironmentsService } from "@services/utility/environments.service";
import { Subscription, debounceTime, distinctUntilChanged, map, filter, switchMap, tap } from "rxjs";

@Component({
  selector: 'opdex-tx-provide-remove',
  templateUrl: './tx-provide-remove.component.html',
  styleUrls: ['./tx-provide-remove.component.scss'],
  animations: [CollapseAnimation]
})
export class TxProvideRemoveComponent extends TxBase implements OnChanges, OnDestroy {
  @Input() pool: LiquidityPool;
  icons = Icons;
  form: FormGroup;
  context: UserContext;
  allowance$: Subscription;
  showMore: boolean = false;
  lptInFiatValue: FixedDecimal;
  usdOut: FixedDecimal;
  crsOut: FixedDecimal;
  crsOutMin: FixedDecimal;
  srcOut: FixedDecimal;
  srcOutMin: FixedDecimal;
  deadlineBlock: number;
  toleranceThreshold = 5;
  deadlineThreshold = 10;
  allowanceTransaction$: Subscription;
  allowance: AllowanceValidation;
  latestSyncedBlock$: Subscription;
  latestBlock: number;
  percentageSelected: string;
  balanceError: boolean;
  showTransactionDetails: boolean = true;

  get liquidity(): FormControl {
    return this.form.get('liquidity') as FormControl;
  }

  get percentageOfSupply() {
    const { lpToken } = this.pool;
    const lpInput = new FixedDecimal(this.liquidity.value, lpToken.decimals);
    return lpInput.divide(lpToken.totalSupply).multiply(FixedDecimal.OneHundred(0));
  }

  constructor(
    private _fb: FormBuilder,
    private _liquidityPoolService: LiquidityPoolService,
    protected _injector: Injector,
    private _env: EnvironmentsService
  ) {
    super(_injector);

    if (this.context?.preferences?.deadlineThreshold) {
      this.deadlineThreshold = this.context.preferences.deadlineThreshold;
    }

    if (this.context?.preferences?.toleranceThreshold) {
      this.toleranceThreshold = this.context.preferences.toleranceThreshold;
    }

    this.form = this._fb.group({
      liquidity: [null, [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
    });

    this.allowance$ = this.liquidity.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        map(amount => {
          const amountFixed = new FixedDecimal(amount || '0', this.pool.lpToken.decimals);
          amountFixed.isZero ? this.reset() : this.calcTolerance();
          return amountFixed;
        }),
        filter(amount => !!this.context?.wallet && amount.bigInt > 0),
        switchMap(amount => this.getAllowance(amount.formattedValue)),
        switchMap(allowance => this.validateBalance(allowance.requestToSpend)))
      .subscribe();

    this.latestSyncedBlock$ = this._nodeService.latestBlock$
      .pipe(
        tap(block => this.latestBlock = block),
        tap(_ => this.calcDeadline(this.deadlineThreshold)),
        filter(_ => !!this.context?.wallet && !!this.pool),
        switchMap(_ => this.getAllowance()))
      .subscribe();
  }

  async ngOnChanges(): Promise<void> {
    this.reset();

    if (!!this.pool === false) return;

    if (this.liquidity.value) {
      const allowance = await this.getAllowance(this.liquidity.value);
      this.calcTolerance();
      await this.validateBalance(allowance.requestToSpend);
    }
  }

  async submit(): Promise<void> {
    this.calcDeadline(this.deadlineThreshold);

    // const request = new RemoveLiquidityRequest(
    //   new FixedDecimal(this.liquidity.value, this.pool.lpToken.decimals),
    //   this.crsOutMin,
    //   this.srcOutMin,
    //   this.context.wallet,
    //   this.deadlineBlock
    // );

    // this._platformApi
    //   .removeLiquidityQuote(this.pool.address, request.payload)
    //     .pipe(take(1))
    //     .subscribe((quote: ITransactionQuote) => this.quote(quote),
    //                (error: OpdexHttpError) => this.quoteErrors = error.errors);

    try {
      const amount = new FixedDecimal(this.liquidity.value, this.pool.lpToken.decimals);
      const quote = await this._liquidityPoolService.removeLiquidityQuote(this.pool.srcToken.address, amount, this.crsOutMin, this.srcOutMin, this.deadlineBlock);
      this.quote(quote);
    } catch (error) {
      console.log(error);
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
  }

  calcTolerance(tolerance?: number): void {
    if (tolerance) this.toleranceThreshold = tolerance;

    if (this.toleranceThreshold > 99.99 || this.toleranceThreshold < .01) return;
    if (!this.liquidity.value) return;

    const lptDecimals = this.pool.lpToken.decimals;
    const liquidityValue = new FixedDecimal(this.liquidity.value, lptDecimals);
    const totalSupply = this.pool.lpToken.totalSupply;
    // const reservesUsd = this.pool.summary.reserves.usd;
    const reservesUsd = FixedDecimal.Zero(8);
    const reserveCrs = this.pool.reserveCrs;
    const reserveSrc = this.pool.reserveSrc;

    const percentageLiquidity = liquidityValue.divide(totalSupply);

    this.crsOut = reserveCrs.multiply(percentageLiquidity);
    this.srcOut = reserveSrc.multiply(percentageLiquidity);
    this.usdOut = reservesUsd.multiply(percentageLiquidity);

    const tolerancePercentage = new FixedDecimal((this.toleranceThreshold / 100).toFixed(8), 8);

    const crsTolerance = this.crsOut.multiply(tolerancePercentage);
    const srcTolerance = this.srcOut.multiply(tolerancePercentage);
    const usdTolerance = this.usdOut.multiply(tolerancePercentage);

    this.crsOutMin = this.crsOut.subtract(crsTolerance);
    this.srcOutMin = this.srcOut.subtract(srcTolerance);
    this.lptInFiatValue = this.usdOut.subtract(usdTolerance);
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

  handlePercentageSelect(value: any): void {
    this.percentageSelected = value.percentageOption;
    this.liquidity.setValue(value.result, {emitEvent: true});
  }

  private async getAllowance(amount?: string): Promise<AllowanceValidation> {
    amount = amount || this.liquidity.value;

    this.allowance = await this._validateAllowance(this.context.wallet, this._env.contracts.router, this.pool?.lpToken, amount);

    return this.allowance;
  }

  private async validateBalance(amount: FixedDecimal): Promise<boolean> {
    if (!this.context?.wallet || !this.pool) {
      return false;
    }

    const sufficientBalance = await this._validateBalance(this.pool.lpToken, amount);

    this.balanceError = !sufficientBalance;

    return sufficientBalance;
  }

  private reset(): void {
    this.form.reset();
    this.lptInFiatValue = null;
    this.usdOut = null;
    this.crsOut = null;
    this.crsOutMin = null;
    this.srcOut = null;
    this.srcOutMin = null;
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
