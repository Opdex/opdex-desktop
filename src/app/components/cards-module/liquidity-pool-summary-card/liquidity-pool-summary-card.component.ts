import { IndexerService } from '@services/platform/indexer.service';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';
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

  public get liquidityFiat(): FixedDecimal {
    const { abbreviation } = this.selectedCurrency;
    const { crsToken, srcToken, reserveCrs, reserveSrc } = this.pool;

    if (reserveCrs.isZero || reserveSrc.isZero) return FixedDecimal.Zero(0);

    return crsToken.pricing[abbreviation]
      .multiply(reserveCrs)
      .add(srcToken.pricing[abbreviation]
      .multiply(reserveSrc));
  }

  constructor(
    private _indexerService: IndexerService,
    private _currency: CurrencyService
  ) {
    this.subscription.add(
      this._indexerService.latestBlock$
        .subscribe(block => this.latestBlock = block));

    this.subscription.add(
      this._currency.selectedCurrency$
        .subscribe(currency => this.selectedCurrency = currency));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
