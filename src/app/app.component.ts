import { INodeStatus } from './interfaces/full-node.interface';
import { NodeService } from './services/platform/node.service';
import { Component, OnInit } from '@angular/core';
import { timer, switchMap, lastValueFrom } from 'rxjs';
import { db } from '@services/data/db.service';
import { PoolRepositoryService } from '@services/data/pool-repository.service';
import { TokenRepositoryService } from '@services/data/token-repository.service';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { MarketService } from '@services/platform/market.service';
import { MiningService } from '@services/platform/mining.service';
import { PoolService } from '@services/platform/pool.service';
import { TokenService } from '@services/platform/token.service';

@Component({
  selector: 'opdex-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  nodeStatus: INodeStatus;
  indexed: boolean = false;

  constructor(
    private _nodeService: NodeService,
    private _marketService: MarketService,
    private _poolsService: PoolService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _miningService: MiningService,
    private _poolsFactory: LiquidityPoolFactoryService
  ) { }

  ngOnInit(): void {
    timer(0, 10000)
      .pipe(
        switchMap(_ => this._nodeService.refreshStatus$())
      )
      .subscribe(status => {
        this.nodeStatus = status;
        if (status.inIbd) {
          // Todo: node is syncing, wait
          return;
        }

        // Todo: Watch each new block on timer or signalR
        // Todo: Index primary data periodically
        // --- OnInit - if indexing, show loader
      });

    this._nodeService.latestBlock$
      .subscribe(async status => {
        await this._indexLatest();
      });
  }

  private async _indexLatest() {
    const indexer = await db.indexer.get(1);

    console.log(indexer)

    const [pools, rewardedMiningPools] = await Promise.all([
      lastValueFrom(this._marketService.getMarketPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningService.getRewardedPools(indexer?.lastUpdateBlock)),
    ]);

    const nodeStatus = this._nodeService.status;
    console.log(nodeStatus)
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
          miningPool: pool.miningPool,
          transactionFee: pool.transactionFee
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

    this.indexed = true;
  }
}
