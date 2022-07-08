import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit } from '@angular/core';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pools: any[];
  odx: Token;
  crs = Token.Crs();

  constructor(
    private _poolsFactory: LiquidityPoolFactoryService
  ) { }

  async ngOnInit(): Promise<void> {
    this.pools = await this._poolsFactory.buildLiquidityPools();
  }
}
