import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';
import { NodeService } from '@services/platform/node.service';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Subscription } from 'rxjs';
import { Icons } from '@enums/icons';
import { Component, Input, OnDestroy } from '@angular/core';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-liquidity-pool-summary-card',
  templateUrl: './liquidity-pool-summary-card.component.html',
  styleUrls: ['./liquidity-pool-summary-card.component.scss']
})
export class LiquidityPoolSummaryCardComponent implements OnDestroy {
  @Input() pool: LiquidityPool;
  @Input() showPoolName: boolean;
  latestBlock: number;
  selectedCurrency: ICurrency;
  icons = Icons;
  subscription = new Subscription();
  one = FixedDecimal.One(0);

  // public get miningUsd(): FixedDecimal {
  //   if (!!this.pool?.miningPool === false) return FixedDecimal.Zero(0);

  //   const { priceUsd } = this.pool.tokens.lp.summary;
  //   const { tokensMining } = this.pool.miningPool;

  //   return priceUsd.multiply(tokensMining);
  // }

  constructor(
    private _nodeService: NodeService,
    private _currency: CurrencyService
  ) {
    this.subscription.add(
      this._nodeService.latestBlock$
        .subscribe(block => this.latestBlock = block));

    this.subscription.add(
      this._currency.selectedCurrency$
        .subscribe(currency => this.selectedCurrency = currency));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
