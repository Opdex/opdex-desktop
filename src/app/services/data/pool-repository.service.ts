import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { db } from './db.service';
import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class PoolRepositoryService {
  constructor() { }

  async getPoolByAddress(address: string) {
    return await db.liquidityPool.get({ address });
  }

  async persistPools(pools: ILiquidityPoolEntity[]) {
    const entities = await db.liquidityPool.toArray();

    await db.liquidityPool.bulkPut(pools.map(pool => {
      return {
        ...pool,
        id: entities.find(entity => entity.address === pool.address)?.id
      }
    }));
  }
}
