import { Injectable } from "@angular/core";
import { db } from "@services/data/db.service";
import { PoolRepositoryService } from "@services/data/pool-repository.service";
import { TokenRepositoryService } from "@services/data/token-repository.service";
import { lastValueFrom } from "rxjs";
import { MarketService } from "./market.service";
import { MiningService } from "./mining.service";
import { NodeService } from "./node.service";
import { PoolService } from "./pool.service";
import { TokenService } from "./token.service";

@Injectable({providedIn: 'root'})
export class IndexerService {
  indexing: boolean = false;

  constructor(
    private _nodeService: NodeService,
    private _marketService: MarketService,
    private _poolsService: PoolService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _miningService: MiningService
  ) { }

  public async index(): Promise<void> {
    if (this.indexing) return;

    this.indexing = true;

    const indexer = await db.indexer.get(1);
    const nodeStatus = this._nodeService.status;

    const [pools, rewardedMiningPools, nominations] = await Promise.all([
      lastValueFrom(this._marketService.getMarketPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningService.getRewardedPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningService.getNominatedPools())
    ]);

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

        console.log(token.nativeChain, token.nativeAddress);

        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: decimals,
          nativeChain: token.nativeChain || 'Cirrus',
          nativeChainAddress: token.nativeChainAddress
        }
      }));
    }

    // Todo: Persist active mining pools
    console.log(rewardedMiningPools);

    // Todo: Persist nominations
    console.log(nominations);

    // Todo: Refresh vault proposals

    db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    this.indexing = false;
  }
}
