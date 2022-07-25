import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { MiningGovernance } from '@models/platform/mining-governance';
import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { MiningGovernanceService } from '@services/platform/mining-governance.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit, OnDestroy {
  miningGovernance: MiningGovernance;
  nominatedPools: LiquidityPool[];
  miningPools: LiquidityPool[];
  subscription = new Subscription();
  icons = Icons;

  constructor(
    private _miningGovernanceService: MiningGovernanceService,
    private _nodeService: NodeService,
    private _liquidityPoolService: LiquidityPoolService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(latestBlock => this._miningGovernanceService.buildMiningGovernance(latestBlock)),
          tap(gov => this.miningGovernance = gov),
          switchMap(_ => this._liquidityPoolService.buildNominatedLiquidityPools()),
          tap(pools => this.nominatedPools = pools),
          switchMap(_ => this._liquidityPoolService.buildActiveMiningPools()),
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
