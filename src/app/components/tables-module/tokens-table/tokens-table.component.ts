import { CurrencyService } from '@services/platform/currency.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { NodeService } from '@services/platform/node.service';
import { TokenService } from '@services/platform/token.service';
import { Token } from '@models/platform/token';
import { Component, Input, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subscription, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Icons } from 'src/app/enums/icons';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { IPagination } from '@interfaces/database.interface';

@Component({
  selector: 'opdex-tokens-table',
  templateUrl: './tokens-table.component.html',
  styleUrls: ['./tokens-table.component.scss']
})
export class TokensTableComponent implements OnInit, OnDestroy {
  @Input() take: number = 10;
  skip = 0;
  displayedColumns: string[];
  dataSource: MatTableDataSource<any>;
  previous: boolean;
  next: boolean;
  selectedCurrency: ICurrency;
  subscription: Subscription = new Subscription();
  icons = Icons;
  loading = true;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private _router: Router,
    private _tokensService: TokenService,
    private _nodeService: NodeService,
    // private _sidebar: SidenavService,
    private _liquidityPoolsService: LiquidityPoolService,
    private _currencyService: CurrencyService
  ) {
    this.dataSource = new MatTableDataSource<any>();
    this.displayedColumns = ['token', 'name', 'nativeChain', 'price', 'actions'];
  }

  ngOnInit(): void {
    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(_ => this.getTokens$(this.skip, this.take)),
          switchMap(_ => this._currencyService.selectedCurrency$),
          tap(currency => this.selectedCurrency = currency))
        .subscribe(_ => this.loading = false));
  }

  private async getTokens$(skip: number, take: number): Promise<IPagination<Token>> {
    const result = await this._tokensService.buildTokens(skip, take);
    this.dataSource.data = [...result.results];
    this.previous = this.skip > 0 && result.count > this.skip;
    this.next = result.count > this.take + this.skip;
    return result;
  }

  provide(poolAddress: string): void {
    // this._openSidebarWithPool(TransactionView.provide, poolAddress);
  }

  swap(poolAddress: string): void {
    // this._openSidebarWithPool(TransactionView.swap, poolAddress);
  }

  async pageChange(isNext: boolean): Promise<void> {
    this.skip = isNext
      ? this.skip + this.take
      : this.skip - this.take;

    await this.getTokens$(this.skip, this.take)
  }

  navigate(name: string): void {
    this._router.navigateByUrl(`/tokens/${name}`);
  }

  trackBy(index: number, token: Token): string {
    return `${index}-${token?.trackBy}`;
  }

  // private _openSidebarWithPool(txView: TransactionView, address: string): void {
  //   this._liquidityPoolsService.getLiquidityPool(address)
  //     .pipe(take(1))
  //     .subscribe(pool => this._sidebar.openSidenav(txView, { pool }));
  // }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}