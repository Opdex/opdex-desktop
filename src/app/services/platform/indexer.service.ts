import { EnvironmentsService } from '@services/utility/environments.service';
import { TokenService } from '@services/platform/token.service';
import { VaultService } from '@services/platform/vault.service';
import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { OpdexDB } from '@services/database/db.service';
import { Injectable } from "@angular/core";
import { PoolRepositoryService } from "@services/database/pool-repository.service";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { BehaviorSubject, filter, firstValueFrom, Observable } from "rxjs";
import { MarketService } from "./market.service";
import { NodeService } from "./node.service";
import { LiquidityPoolService } from './liquidity-pool.service';
import { MiningGovernanceService } from './mining-governance.service';

@Injectable({providedIn: 'root'})
export class IndexerService {
  indexing: boolean = false;
  hasIndexed = new BehaviorSubject(false);

  // Latest indexed block
  private _block: number;
  private _block$ = new BehaviorSubject<number>(null);

  public get latestBlock() {
    return this._block;
  }

  public get latestBlock$(): Observable<number> {
    return this._block$.asObservable().pipe(filter(block => !!block));
  }

  constructor(
    private _nodeService: NodeService,
    private _marketService: MarketService,
    private _liquidityPoolService: LiquidityPoolService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _miningGovernanceService: MiningGovernanceService,
    private _vaultService: VaultService,
    private _vaultRepository: VaultRepositoryService,
    private _db: OpdexDB,
    private _env: EnvironmentsService
  ) { }

  public async index(resync: boolean = false): Promise<void> {
    if (this.indexing) return;

    this.indexing = true;

    if (resync) {
      this.hasIndexed.next(false);

      await this._db.delete();
      await this._db.open();
    }

    const indexer = await this._db.indexer.get(1);
    const lastUpdateBlock = indexer?.lastUpdateBlock || this._env.startHeight
    const nodeStatus = this._nodeService.status;

    const [pools, rewardedMiningPools, nominations, createdProposals, createdCertificates, completedProposals, redeemedCertificates, revokedCertificates] = await Promise.all([
      firstValueFrom(this._marketService.getMarketPools(lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceService.getRewardedPools(lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceService.getNominatedPools()),
      firstValueFrom(this._vaultService.getCreatedVaultProposals(lastUpdateBlock)),
      firstValueFrom(this._vaultService.getCreatedVaultCertificates(lastUpdateBlock)),
      firstValueFrom(this._vaultService.getCompletedVaultProposals(lastUpdateBlock)),
      firstValueFrom(this._vaultService.getRedeemedVaultCertificates(lastUpdateBlock)),
      firstValueFrom(this._vaultService.getRevokedVaultCertificates(lastUpdateBlock)),
    ]);

    const poolsDetails = await Promise.all(pools.map(async pool => {
      const poolDetails = await firstValueFrom(this._liquidityPoolService.getStaticPool(pool.pool));
      const tokenDetails = await firstValueFrom(this._tokenService.getToken(pool.token));

      const poolResponse = {
        pool: poolDetails,
        token: tokenDetails,
        createdBlock: pool.createdBlock
      };

      return poolResponse;
    }));

    if (poolsDetails.length) {
      await this._poolsRepository.persistPools(poolsDetails.map(({pool, token, createdBlock}) => {
        return {
          address: pool.address,
          name: `${token.symbol}-${nodeStatus.coinTicker}`,
          srcToken: token.address,
          miningPool: pool.miningPool,
          transactionFee: pool.transactionFee,
          isNominated: 0,
          miningPeriodEndBlock: 0, // false by default
          createdBlock
        }
      }));

      await this._tokenRepository.persistTokens(poolsDetails.map(({token, createdBlock}) => {
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: parseInt(token.decimals),
          nativeChain: token.nativeChain || 'Cirrus',
          nativeChainAddress: token.nativeChainAddress,
          createdBlock
        }
      }));
    }

    // Persist active mining pools
    if (rewardedMiningPools.length) {
      const miningPoolEndBlocks = await firstValueFrom(this._liquidityPoolService.getMiningPeriodEndBlocks(rewardedMiningPools.map(pool => pool.miningPool)));
      const miningPoolEntities = await this._poolsRepository.getPoolsByMiningPoolAddress(miningPoolEndBlocks.map(pool => pool.miningPool));

      await this._poolsRepository.persistPools(miningPoolEntities.map((entity: ILiquidityPoolEntity) => {
        return {
          ...entity,
          miningPeriodEndBlock: miningPoolEndBlocks.find(pool => pool.miningPool === entity.miningPool).miningPeriodEndBlock
        }
      }));
    }

    // Persist nominations
    await this._poolsRepository.setNominations(nominations.map(({stakingPool}) => stakingPool));

    // Persist created vault proposals
    if (createdProposals.length) {
      await this._vaultRepository.persistProposals(createdProposals.map(proposal => {
        return {
          proposalId: proposal.proposalId,
          type: proposal.type,
          description: proposal.description,
          wallet: proposal.wallet,
          createdBlock: proposal.blockHeight,
          creator: proposal.from,
          approved: 0 // false by default
        }
      }))
    }

    // persist created certificates
    if (createdCertificates.length) {
      await this._vaultRepository.persistCertificates(createdCertificates.map(certificate => {
        return {
          owner: certificate.owner,
          amount: certificate.amount,
          redeemed: 0, // false by default
          revoked: 0, // false by default
          vestedBlock: certificate.vestedBlock,
          createdBlock: certificate.blockHeight
        }
      }))
    }

    if (completedProposals.length) {
      await this._vaultRepository.setCompletedProposals(completedProposals)
    }

    if (redeemedCertificates.length) {
      await Promise.all(redeemedCertificates.map(cert => {
        return this._vaultRepository.setCertificateRedemption(cert.vestedBlock)
      }))
    }

    if (revokedCertificates.length) {
      await Promise.all(revokedCertificates.map(cert => {
        return this._vaultRepository.setCertificateRevocation(cert.vestedBlock, cert.newAmount)
      }))
    }

    await this._db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    this._block = nodeStatus.blockStoreHeight;
    this._block$.next(this._block);
    this.indexing = false;
    this.hasIndexed.next(true);
  }
}
