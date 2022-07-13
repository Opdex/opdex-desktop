import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { MiningGovernance } from '@models/platform/mining-governance';
import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { MiningGovernanceFactoryService } from '@services/factory/mining-governance-factory.service';
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
    private _miningGovernanceFactory: MiningGovernanceFactoryService,
    private _nodeService: NodeService,
    private _liquidityPoolFactory: LiquidityPoolFactoryService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(latestBlock => this._miningGovernanceFactory.buildMiningGovernance(latestBlock)),
          tap(gov => this.miningGovernance = gov),
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
