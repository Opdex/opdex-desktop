import { EnvironmentsService } from '@services/utility/environments.service';
import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { TokenRepositoryService } from '@services/database/token-repository.service';
import { TokenService } from '@services/platform/token.service';
import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class LiquidityPoolFactoryService {
  constructor(
    private _liquidityPoolService: LiquidityPoolService,
    private _poolRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _env: EnvironmentsService
  ) { }

  public async buildLiquidityPool(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  public async buildNominatedLiquidityPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getNominatedPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  private async _buildLiquidityPool(entity: ILiquidityPoolEntity): Promise<LiquidityPool> {
    const hydrated = await lastValueFrom(this._liquidityPoolService.getHydratedPool(entity.address, entity.miningPool));
    const srcTokenEntity = await this._tokenRepository.getTokenByAddress(entity.srcToken);
    const stakingTokenEntity = await this._tokenRepository.getTokenByAddress(this._env.contracts.odx);

    return new LiquidityPool(entity, hydrated, srcTokenEntity, stakingTokenEntity);
  }
}
