import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { VaultService } from './vault.service';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { MiningPoolService } from './mining-pool.service';
import { OpdexDB } from '@services/database/db.service';
import { Injectable } from "@angular/core";
import { PoolRepositoryService } from "@services/database/pool-repository.service";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { firstValueFrom } from "rxjs";
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
    private _miningGovernanceService: MiningGovernanceService,
    private _miningPoolService: MiningPoolService,
    private _vaultService: VaultService,
    private _vaultRepository: VaultRepositoryService,
    private _db: OpdexDB
  ) { }

  public async index(): Promise<void> {
    if (this.indexing) return;

    this.indexing = true;

    const indexer = await this._db.indexer.get(1);
    const nodeStatus = this._nodeService.status;

    const [pools, rewardedMiningPools, nominations, createdProposals, createdCertificates, completedProposals, redeemedCertificates, revokedCertificates] = await Promise.all([
      firstValueFrom(this._marketService.getMarketPools(indexer?.lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceService.getRewardedPools(indexer?.lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceService.getNominatedPools()),
      firstValueFrom(this._vaultService.getCreatedVaultProposals(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultService.getCreatedVaultCertificates(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultService.getCompletedVaultProposals(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultService.getRedeemedVaultCertificates(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultService.getRevokedVaultCertificates(indexer?.lastUpdateBlock)),
    ]);

    console.log(createdProposals)
    console.log(createdCertificates)
    console.log(completedProposals)
    console.log(redeemedCertificates)
    console.log(revokedCertificates)

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
        const decimals = parseInt(token.decimals);

        // console.log(token.nativeChain, token.nativeAddress);

        // Todo: try/catch checksummed native chain address, validate against supported FN tokens
        // Todo: -- Add functionality to re-validate interflux tokens
        // ----------- Edge case when opdex-desktop syncs new pools/tokens but the user hasn't updated their FN yet.
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: decimals,
          nativeChain: token.nativeChain || 'Cirrus',
          nativeChainAddress: token.nativeChainAddress ? toChecksumAddress(token.nativeChainAddress) : undefined,
          createdBlock
        }
      }));
    }

    // Persist active mining pools
    if (rewardedMiningPools.length) {
      const miningPoolEndBlocks = await firstValueFrom(this._miningPoolService.getMiningPeriodEndBlocks(rewardedMiningPools.map(pool => pool.miningPool)));
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
          createdBlock: proposal.blockHeight
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

    // Todo: persist redemption flags
    if (redeemedCertificates.length) {
      await Promise.all(redeemedCertificates.map(cert => {
        return this._vaultRepository.setCertificateRedemption(cert.vestedBlock)
      }))
    }

    // Todo: persist revoked certificates
    if (revokedCertificates.length) {
      await Promise.all(revokedCertificates.map(cert => {
        return this._vaultRepository.setCertificateRevocation(cert.vestedBlock, cert.newAmount)
      }))
    }

    await this._db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    this.indexing = false;
  }
}
