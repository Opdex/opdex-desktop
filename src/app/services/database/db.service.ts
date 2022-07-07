import { EnvironmentsService } from '@services/utility/environments.service';
import { Injectable } from '@angular/core';
import { IIndexerEntity, ILiquidityPoolEntity, ITokenEntity } from '@interfaces/database.interface';
import Dexie, { Table } from 'dexie';
import { Network } from '@enums/networks';

@Injectable({providedIn: "root"})
export class OpdexDB extends Dexie {
  indexer!: Table<IIndexerEntity, number>;
  liquidityPool!: Table<ILiquidityPoolEntity, number>;
  token!: Table<ITokenEntity, number>;

  constructor(private _env: EnvironmentsService) {
    // opdex-main, opdex-test, opdex-dev
    super(`opdex-${_env.network === Network.Mainnet
        ? 'main'
        : _env.network === Network.Testnet
          ? 'test'
          : 'dev'}`);

    this.version(1).stores({
      indexer: '++id, lastUpdateBlock',
      liquidityPool: '++id, &address, name, srcToken, miningPool, transactionFee, isNominated',
      token: '++id, &address, symbol, name, decimals, nativeChain, nativeChainAddress'
    });
  }
}
