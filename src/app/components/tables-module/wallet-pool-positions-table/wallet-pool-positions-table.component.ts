import { UserContextService } from '@services/utility/user-context.service';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { WalletService } from '@services/platform/wallet.service';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Icons } from '@enums/icons';
import { TransactionView } from '@enums/transaction-view';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { CurrencyService } from '@services/platform/currency.service';
import { IndexerService } from '@services/platform/indexer.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Subscription, switchMap, tap } from 'rxjs';

type LiquidityPoolPositions = {
  pool: LiquidityPool;
  srcBalance: FixedDecimal;
  stakingBalance: FixedDecimal;
  miningBalance: FixedDecimal;
  providingBalance: FixedDecimal;
}

@Component({
  selector: 'opdex-wallet-pool-positions-table',
  templateUrl: './wallet-pool-positions-table.component.html',
  styleUrls: ['./wallet-pool-positions-table.component.scss']
})
export class WalletPoolPositionsTableComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @Input() take: number = 10;
  skip = 0;
  displayedColumns: string[];
  dataSource: MatTableDataSource<LiquidityPoolPositions>;
  previous: boolean;
  next: boolean;
  selectedCurrency: ICurrency;
  subscription = new Subscription();
  icons = Icons;

  constructor(
    private _router: Router,
    private _indexerService: IndexerService,
    private _liquidityPoolsService: LiquidityPoolService,
    private _currencyService: CurrencyService,
    private _walletService: WalletService,
    private _userContextService: UserContextService
  ) {
    this.dataSource = new MatTableDataSource<LiquidityPoolPositions>();
    this.displayedColumns = ['name', 'srcBalance', 'providingBalance', 'stakingBalance', 'miningBalance', 'options'];
  }

  ngOnInit() {
    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          switchMap(_ => this.getLiquidityPoolPositions$(this.skip, this.take)),
          switchMap(_ => this._currencyService.selectedCurrency$),
          tap(currency => this.selectedCurrency = currency))
        .subscribe());
  }

  private async getLiquidityPoolPositions$(skip: number, take: number): Promise<void> {
    const pools = await this._liquidityPoolsService.getLiquidityPools(skip, take);

    const positionsResults = await Promise.all(pools.results.map(pool => {
      const { address: wallet } = this._userContextService.userContext.wallet;
      const hasStaking = !!pool?.miningPool;

      let calls = [
        this._walletService.getBalance(pool.srcToken.address, wallet),
        this._walletService.getBalance(pool.address, wallet),
      ];

      if (hasStaking) {
        calls.push(
          this._walletService.getStakingPosition(pool.address, wallet),
          this._walletService.getMiningPosition(pool.miningPool?.address, wallet),
        )
      };

      return Promise.all(calls);
    }));

    const positions = positionsResults.map((position, index) => {
      const liquidityPool = pools.results[index];
      const { srcToken, stakingToken, lpToken } = liquidityPool;

      return {
        pool: liquidityPool,
        srcBalance: FixedDecimal.FromBigInt(position[0], srcToken.decimals),
        providingBalance: FixedDecimal.FromBigInt(position[1], lpToken.decimals),
        stakingBalance: FixedDecimal.FromBigInt(position[2] || BigInt('0'), stakingToken.decimals),
        miningBalance: FixedDecimal.FromBigInt(position[3] || BigInt('0'), lpToken.decimals),
      }
    })

    this.dataSource.data = [...positions];
    this.previous = this.skip > 0 && pools.count > this.skip;
    this.next = pools.count > this.take + this.skip;
  }

  navigate(name: string): void {
    this._router.navigateByUrl(`/pools/${name}`);
  }

  trackBy(index: number, position: LiquidityPoolPositions): string {
    return `${index}-${position.pool.trackBy}-${position.srcBalance.formattedValue}-${position.stakingBalance.formattedValue}-${position.miningBalance.formattedValue}-${position.providingBalance.formattedValue}`;
  }

  async pageChange(isNext: boolean): Promise<void> {
    this.skip = isNext
      ? this.skip + this.take
      : this.skip - this.take;

    await this.getLiquidityPoolPositions$(this.skip, this.take)
  }

  provide(pool: LiquidityPool): void {
    this._tradeRoute(pool, TransactionView.provide);
  }

  swap(pool: LiquidityPool): void {
    this._tradeRoute(pool, TransactionView.swap);
  }

  stake(pool: LiquidityPool): void {
    this._tradeRoute(pool, TransactionView.stake);
  }

  mine(pool: LiquidityPool): void {
    this._tradeRoute(pool, TransactionView.mine);
  }

  private _tradeRoute(pool: LiquidityPool, view: TransactionView): void {
    this._router.navigate(['/trade'], {queryParams: {pool: pool.address, view}})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
