import { EnvironmentsService } from './../../services/utility/environments.service';
import { TokenFactoryService } from '@services/factory/token-factory.service';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  pools: any[];
  odx: Token;
  crs = Token.CRS();
  nominatedPools: LiquidityPool[];
  miningPools: LiquidityPool[];
  subscription = new Subscription();

  constructor(
    private _liquidityPoolFactory: LiquidityPoolFactoryService,
    private _nodeService: NodeService,
    private _tokenFactory: TokenFactoryService,
    private _env: EnvironmentsService
  ) { }

  async ngOnInit(): Promise<void> {
    this.pools = await this._liquidityPoolFactory.buildLiquidityPools();

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(_ => this._tokenFactory.buildToken(this._env.contracts.odx)),
          tap(odx => this.odx = odx),
          switchMap(_ => this._liquidityPoolFactory.buildNominatedLiquidityPools()),
          tap(pools => this.nominatedPools = pools),
          switchMap(_ => this._liquidityPoolFactory.buildActiveMiningPools()),
          tap(pools => this.miningPools = pools))
        .subscribe());
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
