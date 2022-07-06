import { Injectable } from "@angular/core";
import { db } from "@services/database/db.service";
import { PoolRepositoryService } from "@services/database/pool-repository.service";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { lastValueFrom } from "rxjs";
import { MarketService } from "./market.service";
import { MiningGovernanceService } from "./mining-governance.service";
import { NodeService } from "./node.service";
import { LiquidityPoolService } from "./liquidity-pool.service";
import { TokenService } from "./token.service";
import { toChecksumAddress } from "ethereum-checksum-address";

@Injectable({providedIn: 'root'})
export class IndexerService {
  indexing: boolean = false;

  constructor(
    private _nodeService: NodeService,
    private _marketService: MarketService,
    private _liquidityPoolService: LiquidityPoolService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _miningGovernanceService: MiningGovernanceService
  ) { }

  public async index(): Promise<void> {
    if (this.indexing) return;

    this.indexing = true;

    const indexer = await db.indexer.get(1);
    const nodeStatus = this._nodeService.status;

    const [pools, rewardedMiningPools, nominations] = await Promise.all([
      lastValueFrom(this._marketService.getMarketPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningGovernanceService.getRewardedPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningGovernanceService.getNominatedPools())
    ]);

    const poolsDetails = await Promise.all(pools.map(async pool => {
      const poolDetails = await lastValueFrom(this._liquidityPoolService.getStaticPool(pool.pool));
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
          transactionFee: pool.transactionFee,
          isNominated: 0 // false by default
        }
      }));

      await this._tokenRepository.persistTokens(poolsDetails.map(({token}) => {
        const decimals = parseInt(token.decimals);

        console.log(token.nativeChain, token.nativeAddress);

        // Todo: try/catch checksummed native chain address, validate against supported FN tokens
        // Todo: -- Add functionality to re-validate interflux tokens
        // ----------- Edge case when opdex-desktop syncs new pools/tokens but the user hasn't updated their FN yet.
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: decimals,
          nativeChain: token.nativeChain || 'Cirrus',
          nativeChainAddress: token.nativeChainAddress ? toChecksumAddress('0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1') : undefined
        }
      }));
    }

    // Todo: Persist active mining pools
    // -- Get mining period end block from each of mining pools
    // -- Persist affected pools
    console.log(rewardedMiningPools); // { stakingPool, miningPool, amount }

    // Todo: Persist nominations
    await this._poolsRepository.setNominations(nominations.map(({stakingPool}) => stakingPool));

    // Todo: Refresh vault proposals

    db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    this.indexing = false;
  }
}
