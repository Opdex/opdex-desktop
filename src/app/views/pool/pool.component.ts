import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit {
  pool: LiquidityPool;

  constructor(
    private _route: ActivatedRoute,
    private _poolFactory: LiquidityPoolFactoryService) { }

  async ngOnInit(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');

    this.pool = await this._poolFactory.buildLiquidityPool(address);
  }
}
