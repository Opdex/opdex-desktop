import { IIndexerEntity, ILiquidityPoolEntity, ITokenEntity } from '@interfaces/database.interface';
import Dexie, { Table } from 'dexie';

export class OpdexDB extends Dexie {
  indexer!: Table<IIndexerEntity, number>;
  liquidityPool!: Table<ILiquidityPoolEntity, number>;
  token!: Table<ITokenEntity, number>;

  constructor() {
    super('opdexDesktop');

    this.version(1).stores({
      indexer: '++id, lastUpdateBlock',
      liquidityPool: '++id, &address, name, srcToken, miningPool, transactionFee, isNominated',
      token: '++id, &address, symbol, name, decimals, nativeChain, nativeChainAddress'
    });
  }
}

export const db = new OpdexDB();