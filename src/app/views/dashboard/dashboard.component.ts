import { IndexerService } from '@services/platform/indexer.service';
import { Router } from '@angular/router';
import { EnvironmentsService } from '@services/utility/environments.service';
import { TokenService } from '@services/platform/token.service';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Subscription, switchMap, tap } from 'rxjs';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Token } from '@models/platform/token';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  odx: Token;
  crs: Token;
  nominatedPools: LiquidityPool[] = [null,null,null,null];
  miningPools: LiquidityPool[] = [null,null,null,null];
  subscription = new Subscription();

  constructor(
    private _liquidityPoolService: LiquidityPoolService,
    private _indexerService: IndexerService,
    private _tokenService: TokenService,
    private _env: EnvironmentsService,
    private _router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          switchMap(_ => this._tokenService.getToken(this._env.contracts.odx)),
          tap(odx => this.odx = odx),
          switchMap(_ => this._tokenService.getToken('CRS')),
          tap(crs => this.crs = crs),
          switchMap(_ => this._liquidityPoolService.getNominatedLiquidityPools()),
          tap(pools => this.nominatedPools = pools),
          switchMap(_ => this._liquidityPoolService.getActiveMiningPools()),
          tap(pools => this.miningPools = pools))
        .subscribe());
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }

  handleTxOption(view: TransactionView) {
    this._router.navigate(['/trade'], {queryParams: {view}})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
