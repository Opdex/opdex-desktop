import { ICurrency } from '@lookups/currencyDetails.lookup';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, OnDestroy, Input, Injector } from "@angular/core";
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
import { CurrencyService } from '@services/platform/currency.service';

@Component({
  selector: 'opdex-tx-provide-remove',
  templateUrl: './tx-provide-remove.component.html',
  styleUrls: ['./tx-provide-remove.component.scss'],
  animations: [CollapseAnimation]
})
export class TxProvideRemoveComponent extends TxBase implements OnDestroy {
  _pool: LiquidityPool;
  icons = Icons;
  form: FormGroup;
  context: UserContext;
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
  allowance: AllowanceValidation;
  latestBlock: number;
  percentageSelected: string;
  balanceError: boolean;
  showTransactionDetails: boolean = true;
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
    private _env: EnvironmentsService,
    private _currencyService: CurrencyService
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

    this.subscription.add(
      this._currencyService.selectedCurrency$
        .pipe(tap(currency => this._setSelectedCurrency(currency)))
        .subscribe());

    this.subscription.add(
      this.liquidity.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          map(amount => {
            const amountFixed = new FixedDecimal(amount || '0', this.pool.lpToken.decimals);
            amountFixed.isZero ? this.reset() : this.calcTolerance();
            return amountFixed;
          }),
          filter(amount => this.context?.isLoggedIn && amount.bigInt > 0),
          switchMap(amount => this.getAllowance(amount.formattedValue)),
          switchMap(allowance => this.validateBalance(allowance.requestToSpend)))
        .subscribe());

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          tap(_ => this.calcDeadline(this.deadlineThreshold)),
          filter(_ => this.context?.isLoggedIn && !!this.pool),
          switchMap(_ => this.getAllowance()))
        .subscribe());
  }

  async submit(): Promise<void> {
    this.calcDeadline(this.deadlineThreshold);

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
    const { abbreviation } = this.selectedCurrency;
    const reservesUsd = this.pool.crsToken.pricing[abbreviation]
      .multiply(this.pool.reserveCrs)
      .add(this.pool.srcToken.pricing[abbreviation]
      .multiply(this.pool.reserveSrc));
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

  private _setSelectedCurrency(currency?: ICurrency): void {
    if (!currency) currency = this.selectedCurrency;
    else this.selectedCurrency = currency;

    if (this.pool && this.liquidity.value) {
      this.calcTolerance();
    }
  }

  private async getAllowance(amount?: string): Promise<AllowanceValidation> {
    amount = amount || this.liquidity.value;

    this.allowance = await this._validateAllowance(this.context.wallet.address, this._env.contracts.router, this.pool?.lpToken, amount);

    return this.allowance;
  }

  private async validateBalance(amount: FixedDecimal): Promise<boolean> {
    if (!this.context?.isLoggedIn || !this.pool) {
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
    this.subscription.unsubscribe();
  }
}
