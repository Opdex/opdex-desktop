import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { db } from './db.service';
import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class PoolRepositoryService {
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

  async getNominatedPools(): Promise<ILiquidityPoolEntity[]> {
    return await db.liquidityPool.where('isNominated').equals(1).toArray();
  }

  async setNominations(nominations: string[]): Promise<void> {
    // Clear all non nominated pools
    await db.liquidityPool
      .where('isNominated').equals(1)
        .and(item => !nominations.includes(item.address))
          .modify({isNominated: 0});

    // Set new nominated pools
    await db.liquidityPool
      .where('address').anyOfIgnoreCase(nominations)
        .and(item => item.isNominated === 0)
          .modify({isNominated: 1});
  }
}
