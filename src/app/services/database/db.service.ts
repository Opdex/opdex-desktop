import { EnvironmentsService } from '@services/utility/environments.service';
import { Injectable } from '@angular/core';
import { IIndexerEntity, ILiquidityPoolEntity, ITokenEntity, IVaultCertificateEntity, IVaultProposalEntity } from '@interfaces/database.interface';
import Dexie, { Table } from 'dexie';
import { Network } from '@enums/networks';

@Injectable({providedIn: "root"})
export class OpdexDB extends Dexie {
  indexer!: Table<IIndexerEntity, number>;
  liquidityPool!: Table<ILiquidityPoolEntity, number>;
  token!: Table<ITokenEntity, number>;
  proposal!: Table<IVaultProposalEntity, number>;
  certificate!: Table<IVaultCertificateEntity, number>;

  constructor(private _env: EnvironmentsService) {
    // opdex-main, opdex-test, opdex-dev
    super(`opdex-${_env.network === Network.Mainnet
        ? 'main'
        : _env.network === Network.Testnet
          ? 'test'
          : 'dev'}`);

    this.version(1).stores({
      indexer: '++id, lastUpdateBlock',
      liquidityPool: '++id, &address, name, srcToken, miningPool, transactionFee, isNominated, miningPeriodEndBlock, createdBlock',
      token: '++id, &address, symbol, name, decimals, nativeChain, nativeChainAddress, createdBlock',
      proposal: '++id, &proposalId, type, description, wallet, createdBlock',
      certificate: '++id, owner, amount, redeemed, revoked, vestedBlock, createdBlock'
    });
  }
}
