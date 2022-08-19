import { IndexerService } from '@services/platform/indexer.service';
import { CurrencyService } from '@services/platform/currency.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, ViewChild, OnDestroy, OnInit, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Icons } from 'src/app/enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { IPagination } from '@interfaces/database.interface';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-pools-table',
  templateUrl: './pools-table.component.html',
  styleUrls: ['./pools-table.component.scss']
})
export class PoolsTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  @Input() take: number = 10;
  skip = 0;
  displayedColumns: string[];
  dataSource: MatTableDataSource<LiquidityPool>;
  previous: boolean;
  next: boolean;
  selectedCurrency: ICurrency;
  subscription = new Subscription();
  icons = Icons;

  constructor(
    private _router: Router,
    private _indexerService: IndexerService,
    private _liquidityPoolsService: LiquidityPoolService,
    private _currencyService: CurrencyService
  ) {
    this.dataSource = new MatTableDataSource<LiquidityPool>();
    this.displayedColumns = ['name', 'liquidity', 'stakingWeight', 'mining', 'options'];
  }

  ngOnInit() {
    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          switchMap(_ => this.getLiquidityPools$(this.skip, this.take)),
          switchMap(_ => this._currencyService.selectedCurrency$),
          tap(currency => this.selectedCurrency = currency))
        .subscribe());
  }

  private async getLiquidityPools$(skip: number, take: number): Promise<IPagination<LiquidityPool>> {
    const result = await this._liquidityPoolsService.getLiquidityPools(skip, take);
    this.dataSource.data = [...result.results];
    this.previous = this.skip > 0 && result.count > this.skip;
    this.next = result.count > this.take + this.skip;
    return result;
  }

  navigate(name: string): void {
    this._router.navigateByUrl(`/pools/${name}`);
  }

  trackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }

  async pageChange(isNext: boolean): Promise<void> {
    this.skip = isNext
      ? this.skip + this.take
      : this.skip - this.take;

    await this.getLiquidityPools$(this.skip, this.take)
  }

  provide(pool: any): void {
    this._tradeRoute(pool, TransactionView.provide);
  }

  swap(pool: any): void {
    this._tradeRoute(pool, TransactionView.swap);
  }

  stake(pool: any): void {
    this._tradeRoute(pool, TransactionView.stake);
  }

  mine(pool: any): void {
    this._tradeRoute(pool, TransactionView.mine);
  }

  private _tradeRoute(pool: LiquidityPool, view: TransactionView): void {
    this._router.navigate(['/trade'], {queryParams: {pool: pool.address, view}})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
