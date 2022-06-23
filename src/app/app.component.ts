import { liveQuery } from 'dexie';
import { TokenService } from './services/platform/token.service';
import { PoolService } from '@services/platform/pool.service';
import { Component, OnInit } from '@angular/core';
import { MarketService } from '@services/platform/market.service';
import { lastValueFrom, of, switchMap, tap } from 'rxjs';
import { db } from './services/data/db.service';

@Component({
  selector: 'opdex-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  pools: any[];

  constructor(
    private _marketService: MarketService,
    private _poolsService: PoolService,
    private _tokenService: TokenService
  ) {

  }

  async ngOnInit(): Promise<void> {
    of(null)
      .pipe(
        tap(_ => console.log('hit')),
        switchMap(_ => liveQuery(() => db.indexer.get(1))),
        tap(value => console.log(value))
      ).subscribe(value => console.log(value));
    // console.log(index)
    await this._refreshPools();
  }

  private async _refreshPools() {
    const pools = await lastValueFrom(this._marketService.getMarketPools());

    this.pools = await Promise.all(pools.map(async pool => {
      const poolDetails = await lastValueFrom(this._poolsService.getPool(pool.pool));
      const tokenDetails = await lastValueFrom(this._tokenService.getToken(pool.token));

      const poolResponse = {
        pool: poolDetails,
        token: tokenDetails
      };

      return poolResponse;
    }));

    db.liquidityPool.bulkPut(this.pools.map(pool => {
      return {
        address: pool.pool.address,
        name: `${pool.token.symbol}-CRS`,
        srcToken: pool.token.address,
        miningPool: ''
      }
    }));

    db.token.bulkPut(this.pools.map(pool => {
      return {
        address: pool.pool.address,
        name: pool.token.name,
        symbol: pool.token.symbol,
        decimals: pool.token.decimals,
        sats: ''
      }
    }));

    db.indexer.put({
      lastUpdateBlock: 12,
      id: 1
    })

    console.log(this.pools);
  }
}
