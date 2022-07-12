import { NodeService } from '@services/platform/node.service';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { OpdexDB } from './db.service';
import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class PoolRepositoryService {
  constructor(private _db: OpdexDB, private _nodeService: NodeService) { }

  async getPoolByAddress(address: string): Promise<ILiquidityPoolEntity> {
    return await this._db.liquidityPool.get({ address });
  }

  async getPools(skip: number = 0, take: number = 10): Promise<ILiquidityPoolEntity[]> {
    return await this._db.liquidityPool.offset(skip).limit(take).toArray();
  }

  async getPoolsByMiningPoolAddress(miningPools: string[]): Promise<ILiquidityPoolEntity[]> {
    return await this._db.liquidityPool.where('miningPool').anyOf(miningPools).toArray();
  }

  async persistPools(pools: ILiquidityPoolEntity[]) {
    const addresses = pools.map(pool => pool.address);

    const entities = await this._db.liquidityPool
      .where('address')
      .anyOf(addresses).toArray();

    await this._db.liquidityPool.bulkPut(pools.map(pool => {
      return {
        ...pool,
        id: entities.find(entity => entity.address === pool.address)?.id
      }
    }));
  }

  async getNominatedPools(): Promise<ILiquidityPoolEntity[]> {
    return await this._db.liquidityPool.where('isNominated').equals(1).toArray();
  }

  async getActiveMiningPools(): Promise<ILiquidityPoolEntity[]> {
    return await this._db.liquidityPool
      .where('miningPeriodEndBlock')
      .aboveOrEqual(this._nodeService.latestBlock)
      .toArray();
  }

  async setNominations(nominations: string[]): Promise<void> {
    // Clear all non nominated pools
    await this._db.liquidityPool
      .where('isNominated').equals(1)
        .and(item => !nominations.includes(item.address))
          .modify({isNominated: 0});

    // Set new nominated pools
    await this._db.liquidityPool
      .where('address').anyOf(nominations)
        .and(item => item.isNominated === 0)
          .modify({isNominated: 1});
  }
}
