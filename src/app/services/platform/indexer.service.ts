import { EnvironmentsService } from '@services/utility/environments.service';
import { TokenService } from '@services/platform/token.service';
import { CompletedVaultProposalTransaction, VaultService } from '@services/platform/vault.service';
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

    // Todo: Combine completedVaultProposals, revokedCertificates and createdCertificates since they all log in one transaction
    const [poolReceipts, rewardedMiningPoolReceipts, nominations, createdProposals, completedProposals, redeemedCertificates] = await Promise.all([
      firstValueFrom(this._marketService.getMarketPools(lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceService.getRewardedPoolReceipts$(lastUpdateBlock)),
      firstValueFrom(this._miningGovernanceService.getRawNominatedPools$()),
      firstValueFrom(this._vaultService.getCreatedVaultProposalReceipts(lastUpdateBlock)),
      firstValueFrom(this._vaultService.getCompletedVaultProposalReceipts(lastUpdateBlock)),
      firstValueFrom(this._vaultService.getRedeemedVaultCertificateReceipts(lastUpdateBlock)),
    ]);

    await this._indexPoolsAndTokens(poolReceipts, nodeStatus.coinTicker);
    await this._indexRewardedMiningPools(rewardedMiningPoolReceipts);
    await this._indexNominatedLiquidityPools(nominations);
    await this._indexCreatedVaultProposals(createdProposals);
    await this._indexCompletedVaultProposals(completedProposals);
    await this._indexRedeemedVaultCertificates(redeemedCertificates);

    await this._db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    this._block = nodeStatus.blockStoreHeight;
    this._block$.next(this._block);
    this.indexing = false;
    this.hasIndexed.next(true);
  }

  ////////////////////////////////////////
  //          HELPER METHODS            //
  ////////////////////////////////////////

  private async _indexPoolsAndTokens(poolReceipts: any[], crsTicker: string): Promise<void> {
    const poolsDetails = await Promise.all(poolReceipts.map(async receipt => {
      const poolDetails = await firstValueFrom(this._liquidityPoolService.getRawStaticPoolProperties(receipt.pool));
      const tokenDetails = await firstValueFrom(this._tokenService.getRawStaticTokenProperties(receipt.token));

      const poolResponse = {
        pool: poolDetails,
        token: tokenDetails,
        createdBlock: receipt.createdBlock
      };

      return poolResponse;
    }));

    if (poolsDetails.length) {
      await this._poolsRepository.persistPools(poolsDetails.map(({pool, token, createdBlock}) => {
        return {
          address: pool.address,
          name: `${token.symbol}-${crsTicker}`,
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
          decimals: token.decimals,
          nativeChain: token.nativeChain || 'Cirrus',
          nativeChainAddress: token.nativeChainAddress,
          createdBlock
        }
      }));
    }
  }

  private async _indexRewardedMiningPools(rewardReceipts: any[]): Promise<void> {
    if (rewardReceipts.length) {
      const miningPoolEndBlocks = await firstValueFrom(this._liquidityPoolService.getMiningPeriodEndBlocks(rewardReceipts.map(pool => pool.miningPool)));
      const miningPoolEntities = await this._poolsRepository.getPoolsByMiningPoolAddress(miningPoolEndBlocks.map(pool => pool.miningPool));

      await this._poolsRepository.persistPools(miningPoolEntities.map((entity: ILiquidityPoolEntity) => {
        return {
          ...entity,
          miningPeriodEndBlock: miningPoolEndBlocks.find(pool => pool.miningPool === entity.miningPool).miningPeriodEndBlock
        }
      }));
    }
  }

  private async _indexNominatedLiquidityPools(nominations: any[]): Promise<void> {
    if (nominations.length) {
      const nominatedPools = nominations.map(({stakingPool}) => stakingPool);
      await this._poolsRepository.setNominations(nominatedPools);
    }
  }

  private async _indexCreatedVaultProposals(createdProposals: any[]): Promise<void> {
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
  }

  private async _indexCompletedVaultProposals(transactions: CompletedVaultProposalTransaction[]): Promise<void> {
    if (transactions.length) {
      // Persist created proposals
      await this._vaultRepository.setCompletedProposals(transactions.map(tx => tx.completionLog));

      // Find revoked certs
      const revokedCertificateLogs = transactions
        .filter(tx => !!tx.certRevocationLog)
        .map(tx => tx.certRevocationLog);

      // Persist revoked certs
      if (revokedCertificateLogs.length) {
        await Promise.all(revokedCertificateLogs.map(cert => {
          return this._vaultRepository.setCertificateRevocation(cert.vestedBlock, cert.newAmount)
        }))
      }

      // Find created certificates
      const createdCertificateLogs: any[] = transactions
        .filter(tx => !!tx.certCreationLog)
        .map(tx => {
          return {
            blockHeight: tx.blockHeight,
            proposalId: tx.completionLog.proposalId,
            log: tx.certCreationLog
          }
        });

      // persist created certificates
      if (createdCertificateLogs.length) {
        await this._vaultRepository.persistCertificates(createdCertificateLogs.map(certificate => {
          return {
            owner: certificate.log.owner,
            amount: certificate.log.amount,
            redeemed: 0, // false by default
            revoked: 0, // false by default,
            proposalId: certificate.proposalId,
            vestedBlock: certificate.log.vestedBlock,
            createdBlock: certificate.blockHeight
          }
        }))
      }
    }
  }

  private async _indexRedeemedVaultCertificates(redeemedCertificates: any[]): Promise<void> {
    if (redeemedCertificates.length) {
      await Promise.all(redeemedCertificates.map(cert => {
        return this._vaultRepository.setCertificateRedemption(cert.vestedBlock)
      }))
    }
  }
}
