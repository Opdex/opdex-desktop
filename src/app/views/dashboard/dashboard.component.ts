import { MiningService } from './../../services/platform/mining.service';
import { Component, OnInit } from '@angular/core';
import { db } from '@services/data/db.service';
import { PoolRepositoryService } from '@services/data/pool-repository.service';
import { TokenRepositoryService } from '@services/data/token-repository.service';
import { MarketService } from '@services/platform/market.service';
import { NodeService } from '@services/platform/node.service';
import { PoolService } from '@services/platform/pool.service';
import { TokenService } from '@services/platform/token.service';
import { liveQuery } from 'dexie';
import { of, tap, switchMap, lastValueFrom } from 'rxjs';

@Component({
  selector: 'opdex-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pools: any[];

  constructor(
    private _marketService: MarketService,
    private _poolsService: PoolService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _nodeService: NodeService,
    private _miningService: MiningService
  ) {

  }

  async ngOnInit(): Promise<void> {
    of(null)
      .pipe(
        tap(_ => console.log('hit')),
        switchMap(_ => liveQuery(() => db.indexer.get(1))),
      ).subscribe(value => console.log(value));
    // console.log(index)
    await this._refreshPools();
  }

  private async _refreshPools() {
    const indexer = await db.indexer.get(1);

    const [pools, rewardedMiningPools, nodeStatus] = await Promise.all([
      lastValueFrom(this._marketService.getMarketPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningService.getRewardedPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._nodeService.getStatus())
    ])

    console.log(rewardedMiningPools)

    const poolsDetails = await Promise.all(pools.map(async pool => {
      const poolDetails = await lastValueFrom(this._poolsService.getStaticPool(pool.pool));
      const tokenDetails = await lastValueFrom(this._tokenService.getToken(pool.token));

      const poolResponse = {
        pool: poolDetails,
        token: tokenDetails
      };

      return poolResponse;
    }));

    if (poolsDetails.length) {
      await this._poolsRepository.persistPools(poolsDetails.map(({pool, token}) => {
        return {
          address: pool.address,
          name: `${token.symbol}-${nodeStatus.coinTicker}`,
          srcToken: token.address,
          miningPool: pool.miningPool
        }
      }));

      await this._tokenRepository.persistTokens(poolsDetails.map(({ token }) => {
        const decimals = parseInt(token.decimals);

        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: decimals,
          sats: '1'.padEnd(decimals+1, '0')
        }
      }));
    }

    // Todo: Refresh mining nominations (NominationsLog)
    // Todo: Refresh active mining pools (RewardMiningPoolLog)
    // Todo: Refresh vault proposals

    db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    const entities = await db.liquidityPool.toArray();

    this.pools = await Promise.all(entities.map(async pool => {
      const poolDetails = await lastValueFrom(this._poolsService.getHydratedPool(pool.address, pool.miningPool));
      const tokenDetails = await lastValueFrom(this._tokenService.getToken(pool.srcToken));

      const poolResponse = {
        pool: { ...pool, ...poolDetails },
        token: tokenDetails
      };

      return poolResponse;
    }));

    console.log(this.pools)
  }
}
