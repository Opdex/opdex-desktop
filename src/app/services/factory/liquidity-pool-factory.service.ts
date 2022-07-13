import { TokenFactoryService } from '@services/factory/token-factory.service';
import { MiningPoolService } from '@services/platform/mining-pool.service';
import { EnvironmentsService } from '@services/utility/environments.service';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { TokenRepositoryService } from '@services/database/token-repository.service';
import { TokenService } from '@services/platform/token.service';
import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MiningPool } from '@models/platform/mining-pool';

@Injectable({providedIn: 'root'})
export class LiquidityPoolFactoryService {
  constructor(
    private _liquidityPoolService: LiquidityPoolService,
    private _poolRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _tokenFactory: TokenFactoryService,
    private _env: EnvironmentsService,
    private _miningPoolService: MiningPoolService
  ) { }

  public async buildLiquidityPool(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPoolBySrcToken(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolBySrcAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getPools(0, 20);
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  public async buildActiveMiningPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getActiveMiningPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  public async buildNominatedLiquidityPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getNominatedPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  private async _buildLiquidityPool(entity: ILiquidityPoolEntity): Promise<LiquidityPool> {
    if (!entity) return undefined;

    const hydrated = await lastValueFrom(this._liquidityPoolService.getHydratedPool(entity.address, entity.miningPool));

    let miningPool = null;
    if (entity.srcToken !== this._env.contracts.odx) {
      const miningPoolDto = await lastValueFrom(this._miningPoolService.getHydratedMiningPool(entity.miningPool));
      miningPool = new MiningPool(miningPoolDto);
    }

    hydrated.totalSupply

    const srcToken = await this._tokenFactory.buildToken(entity.srcToken);
    const stakingToken = await this._tokenFactory.buildToken(this._env.contracts.odx);

    return new LiquidityPool(entity, hydrated, miningPool, srcToken, stakingToken);
  }
}
