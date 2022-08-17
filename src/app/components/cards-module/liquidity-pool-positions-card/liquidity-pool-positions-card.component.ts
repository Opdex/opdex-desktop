import { Icons } from '@enums/icons';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { UserContext } from '@models/user-context';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { UserContextService } from '@services/utility/user-context.service';
import { WalletService } from '@services/platform/wallet.service';
import { IndexerService } from '@services/platform/indexer.service';
import { Component, OnChanges, Input, OnDestroy } from '@angular/core';
import { Subscription, switchMap, filter } from 'rxjs';

type LiquidityPoolPositions = {
  crsBalance: FixedDecimal;
  srcBalance: FixedDecimal;
  lptBalance: FixedDecimal;
  stakingPosition?: FixedDecimal;
  miningPosition?: FixedDecimal;
}
@Component({
  selector: 'opdex-liquidity-pool-positions-card',
  templateUrl: './liquidity-pool-positions-card.component.html',
  styleUrls: ['./liquidity-pool-positions-card.component.scss']
})
export class LiquidityPoolPositionsCardComponent implements OnChanges, OnDestroy {
  @Input() pool: LiquidityPool;
  context: UserContext;
  positions: LiquidityPoolPositions;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _indexerService: IndexerService,
    private _walletService: WalletService,
    private _userContextService: UserContextService
  ) { }

  ngOnChanges(): void {
    if (!this.subscription.closed) this.subscription.unsubscribe();

    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          filter(_ => this.context.isLoggedIn && !!this.pool),
          switchMap(_ => this._setPositions()))
        .subscribe());
  }

  private async _setPositions(): Promise<void> {
    const { wallet } = this.context;
    const { crsToken, srcToken, lpToken, address: poolAddress, miningPool, stakingToken } = this.pool;

    const positionCalls = [
      this._walletService.getBalance(crsToken.address, wallet.address),  // CRS Balance
      this._walletService.getBalance(srcToken.address, wallet.address),  // SRC Balance
      this._walletService.getBalance(lpToken.address, wallet.address)    // OLPT Balance
    ];

    if (!!miningPool) {
      positionCalls.push(
        this._walletService.getStakingPosition(poolAddress, wallet.address),   // Staking Balance
        this._walletService.getMiningPosition(miningPool.address, wallet.address)   // Mining Balance
      );
    }

    const response = await Promise.all(positionCalls);

    let positions: LiquidityPoolPositions = {
      crsBalance: FixedDecimal.FromBigInt(response[0], crsToken.decimals),
      srcBalance: FixedDecimal.FromBigInt(response[1], srcToken.decimals),
      lptBalance: FixedDecimal.FromBigInt(response[2], lpToken.decimals),
    };

    if (!!miningPool) {
      positions.stakingPosition = FixedDecimal.FromBigInt(response[3], stakingToken.decimals),
      positions.miningPosition = FixedDecimal.FromBigInt(response[4], lpToken.decimals)
    };

    this.positions = positions;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
