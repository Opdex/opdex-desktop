import { FixedDecimal } from '@models/types/fixed-decimal';
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
  one = FixedDecimal.One(0);
  crsPerOlpt: FixedDecimal;
  srcPerOlpt: FixedDecimal;

  constructor(
    private _route: ActivatedRoute,
    private _poolFactory: LiquidityPoolFactoryService) { }

  async ngOnInit(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');

    if (address !== 'CRS') {
      // SRC token first, fallback if not found to OLPT
      this.pool = await this._poolFactory.buildLiquidityPoolBySrcToken(address) ||
                  await this._poolFactory.buildLiquidityPool(address);

      // Todo: If no pool is found, display an error

      const isOLPT = address === this.pool.lpToken.address;

      if (isOLPT) {
        this.token = this.pool.lpToken;

        const { lpToken, reserveCrs, reserveSrc } = this.pool;

        this.crsPerOlpt = reserveCrs.divide(lpToken.totalSupply);
        this.srcPerOlpt = reserveSrc.divide(lpToken.totalSupply);
      } else {
        this.token = this.pool.srcToken;
      }

      this.token = address === this.pool.srcToken.address ? this.pool.srcToken : this.pool.lpToken;
    } else {
      this.token = Token.CRS();
    }
  }
}
