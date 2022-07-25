import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { VaultApiService } from '../api/smart-contracts/vault-api.service';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { MiningPoolApiService } from '../api/smart-contracts/mining-pool-api.service';
import { OpdexDB } from '@services/database/db.service';
import { Injectable } from "@angular/core";
import { PoolRepositoryService } from "@services/database/pool-repository.service";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { firstValueFrom } from "rxjs";
import { MarketApiService } from "../api/smart-contracts/market-api.service";
import { MiningGovernanceApiService } from "../api/smart-contracts/mining-governance-api.service";
import { NodeService } from "./node.service";
import { LiquidityPoolApiService } from "../api/smart-contracts/liquidity-pool-api.service";
import { TokenApiService } from "../api/smart-contracts/token-api.service";
import { toChecksumAddress } from "ethereum-checksum-address";

@Injectable({providedIn: 'root'})
export class IndexerService {
  indexing: boolean = false;

  constructor(
    private _nodeService: NodeService,
    private _marketApi: MarketApiService,
    private _liquidityPoolApi: LiquidityPoolApiService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenApi: TokenApiService,
    private _tokenRepository: TokenRepositoryService,
    private _miningGovernanceApi: MiningGovernanceApiService,
    private _miningPoolApi: MiningPoolApiService,
    private _vaultApi: VaultApiService,
    private _vaultRepository: VaultRepositoryService,
    private _db: OpdexDB
  ) { }

  public async index(): Promise<void> {
    if (this.indexing) return;

    this.indexing = true;

    const indexer = await this._db.indexer.get(1);
    const nodeStatus = this._nodeService.status;

    const [pools, rewardedMiningPools, nominations, createdProposals, createdCertificates, completedProposals, redeemedCertificates, revokedCertificates] = await Promise.all([
      firstValueFrom(this._marketApi.getMarketPools(indexer?.lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceApi.getRewardedPools(indexer?.lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceApi.getNominatedPools()),
      firstValueFrom(this._vaultApi.getCreatedVaultProposals(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultApi.getCreatedVaultCertificates(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultApi.getCompletedVaultProposals(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultApi.getRedeemedVaultCertificates(indexer?.lastUpdateBlock)),
      firstValueFrom(this._vaultApi.getRevokedVaultCertificates(indexer?.lastUpdateBlock)),
    ]);

    const poolsDetails = await Promise.all(pools.map(async pool => {
      const poolDetails = await firstValueFrom(this._liquidityPoolApi.getStaticPool(pool.pool));
      const tokenDetails = await firstValueFrom(this._tokenApi.getToken(pool.token));

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
      const miningPoolEndBlocks = await firstValueFrom(this._miningPoolApi.getMiningPeriodEndBlocks(rewardedMiningPools.map(pool => pool.miningPool)));
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

    this.indexing = false;
  }
}
