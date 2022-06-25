import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { db } from './db.service';
import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class PoolRepositoryService {
  constructor() { }

  async getPoolByAddress(address: string): Promise<ILiquidityPoolEntity> {
    return await db.liquidityPool.get({ address });
  }

  async getPools(): Promise<ILiquidityPoolEntity[]> {
    return await db.liquidityPool.toArray();
  }

  async persistPools(pools: ILiquidityPoolEntity[]) {
    const addresses = pools.map(pool => pool.address);

    const entities = await db.liquidityPool
      .where('address')
      .anyOfIgnoreCase(addresses).toArray();

    await db.liquidityPool.bulkPut(pools.map(pool => {
      return {
        ...pool,
        id: entities.find(entity => entity.address === pool.address)?.id
      }
    }));
  }
}
