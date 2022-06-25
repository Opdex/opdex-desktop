import { ILiquidityPoolEntity } from '@interfaces/database.interface';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { TokenRepositoryService } from '@services/data/token-repository.service';
import { TokenService } from '@services/platform/token.service';
import { PoolRepositoryService } from '@services/data/pool-repository.service';
import { PoolService } from '@services/platform/pool.service';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { Contracts } from '@lookups/contracts.lookup';

@Injectable({providedIn: 'root'})
export class LiquidityPoolFactoryService {
  constructor(
    private _poolService: PoolService,
    private _poolRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService
  ) { }

  public async buildLiquidityPool(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  private async _buildLiquidityPool(entity: ILiquidityPoolEntity): Promise<LiquidityPool> {
    const hydrated = await lastValueFrom(this._poolService.getHydratedPool(entity.address, entity.miningPool));
    const srcTokenEntity = await this._tokenRepository.getTokenByAddress(entity.srcToken);
    const stakingTokenEntity = await this._tokenRepository.getTokenByAddress(Contracts.mainnet.odx);

    return new LiquidityPool(entity, hydrated, srcTokenEntity, stakingTokenEntity);
  }
}
