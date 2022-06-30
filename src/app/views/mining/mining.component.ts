import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { MiningGovernance } from '@models/platform/mining-governance';
import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap } from 'rxjs';
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
  subscription = new Subscription();
  icons = Icons;
  nominatedPools: LiquidityPool[];

  constructor(
    private _miningGovernanceFactory: MiningGovernanceFactoryService,
    private _nodeService: NodeService,
    private _liquidityPoolFactory: LiquidityPoolFactoryService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(latestBlock => this._miningGovernanceFactory.buildMiningGovernance(latestBlock))
        )
    .subscribe(gov => this.miningGovernance = gov));

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(_ => this._liquidityPoolFactory.buildNominatedLiquidityPools())
        ).subscribe(pools => this.nominatedPools = pools)
    )
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
