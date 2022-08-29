import { LoggerService } from '@services/utility/logger.service';
import { CacheService } from '@services/utility/cache.service';
import { ILiquidityPoolEntity, IPagination } from '@interfaces/database.interface';
import { OpdexDB } from './db.service';
import { Injectable, Injector } from "@angular/core";
import { from, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class PoolRepositoryService extends CacheService {
  constructor(
    private _db: OpdexDB,
    protected _injector: Injector,
    private _logger: LoggerService
  ) {
      super(_injector);
  }

  async searchLiquidityPools(keyword: string): Promise<ILiquidityPoolEntity[]> {
    return await this._db.liquidityPool
      .where('address').equals(keyword)
      .or('name').startsWithIgnoreCase(keyword)
      .toArray();
  }

  getPoolByAddress(address: string): Observable<ILiquidityPoolEntity> {
    const key = `poolByAddress-${address}`;
    const observable = from(this._db.liquidityPool.get({ address }));
    return this.getItem<ILiquidityPoolEntity>(key, observable, 1);
  }

  getPoolBySrcAddress(address: string): Observable<ILiquidityPoolEntity> {
    const key = `poolBySrcToken-${address}`;
    const observable = from(this._db.liquidityPool.get({srcToken: address}));
    return this.getItem<ILiquidityPoolEntity>(key, observable, 1);
  }

  getPoolByMiningPoolAddress(address: string) : Observable<ILiquidityPoolEntity> {
    const key = `poolByMiningPool-${address}`;
    const observable = from(this._db.liquidityPool.get({miningPool: address}));
    return this.getItem<ILiquidityPoolEntity>(key, observable, 1);
  }

  async getPools(skip: number = 0, take: number = 10): Promise<IPagination<ILiquidityPoolEntity>> {
    const count = await this._db.liquidityPool.count();
    const results = await this._db.liquidityPool.offset(skip).limit(take).toArray();
    return { skip, take, results, count };
  }

  async getPoolsByMiningPoolAddress(miningPools: string[]): Promise<ILiquidityPoolEntity[]> {
    return await this._db.liquidityPool.where('miningPool').anyOf(miningPools).toArray();
  }

  async persistPools(pools: ILiquidityPoolEntity[]) {
    try {
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
    } catch (error) {
      this._logger.error(error);
      throw new Error('Unexpected error persisting liquidity pools.');
    }
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
    try {
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
    } catch (error) {
      this._logger.error(error);
      throw new Error('Unexpected error persisting nominations.');
    }
  }
}
