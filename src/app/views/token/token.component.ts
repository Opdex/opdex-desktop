import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Icons } from '@enums/icons';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-token',
  templateUrl: './token.component.html',
  styleUrls: ['./token.component.scss']
})
export class TokenComponent implements OnInit {
  token: Token;
  pool: LiquidityPool;
  icons = Icons;

  constructor(
    private _route: ActivatedRoute,
    private _poolFactory: LiquidityPoolFactoryService) { }

  async ngOnInit(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');

    if (address !== 'CRS') {
      this.pool = await this._poolFactory.buildLiquidityPoolBySrcToken(address);
      this.token = this.pool.srcToken;
    } else {
      this.token = Token.CRS();
    }
  }
}
