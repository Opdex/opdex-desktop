import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, Input, OnChanges, Injector, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TxBase } from '@components/tx-module/tx-base.component';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { FixedDecimal } from '@models/types/fixed-decimal';

@Component({
  selector: 'opdex-tx-stake-collect',
  templateUrl: './tx-stake-collect.component.html',
  styleUrls: ['./tx-stake-collect.component.scss']
})
export class TxStakeCollectComponent extends TxBase implements OnChanges, OnDestroy {
  @Input() data;
  pool: LiquidityPool;
  form: FormGroup;
  balanceError: boolean;
  subscription = new Subscription();

  get liquidate(): FormControl {
    return this.form.get('liquidate') as FormControl;
  }

  constructor(
    private _fb: FormBuilder,
    private _liquidityPoolService: LiquidityPoolService,
    protected _injector: Injector
  ) {
    super(_injector);

    this.form = this._fb.group({
      liquidate: [false]
    });
  }

  ngOnChanges(): void {
    const pool = this.data?.pool;
    if (!!pool === false) {
      return; // No pool found
    }

    if (!this.subscription.closed && this.pool?.address !== pool.address) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }

    this.pool = pool;

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(switchMap(_ => this.validateStakingBalance()))
        .subscribe());
  }

  async submit(): Promise<void> {
    // const request = new CollectStakingRewardsRequest(this.liquidate.value);

    // this._platformApi
    //   .collectStakingRewardsQuote(this.pool.address, request.payload)
    //     .pipe(take(1))
    //     .subscribe((quote: ITransactionQuote) => this.quote(quote),
    //                (error: OpdexHttpError) => this.quoteErrors = error.errors);


      try {
      const response = await this._liquidityPoolService.collectStakingRewardsQuote(this.pool.address, this.liquidate.value);
      this.quote(response);
    } catch (error) {
      console.log(error);
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
  }

  private async validateStakingBalance(): Promise<boolean> {
    if (!!this.pool.stakingToken === false || !this.context?.wallet) {
      return false;
    }

    const amount = FixedDecimal.Zero(this.pool.stakingToken.decimals);
    const sufficientBalance = await this._validateStakingBalance(this.pool, amount);

    this.balanceError = !sufficientBalance;

    return sufficientBalance;
  }

  destroyContext$(): void {
    this.context$.unsubscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.destroyContext$();
  }
}
