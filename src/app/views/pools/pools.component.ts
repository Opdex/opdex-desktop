import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit } from '@angular/core';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-pools',
  templateUrl: './pools.component.html',
  styleUrls: ['./pools.component.scss']
})
export class PoolsComponent implements OnInit {
  pools: LiquidityPool[];

  constructor(private _poolFactory: LiquidityPoolFactoryService) { }

  async ngOnInit(): Promise<void> {
    this.pools = await this._poolFactory.buildLiquidityPools();
    console.log(this.pools)
  }
}
