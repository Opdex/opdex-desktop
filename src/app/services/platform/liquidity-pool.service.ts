import { TokenService } from '@services/platform/token.service';
import { MiningPoolApiService } from '@services/api/smart-contracts/mining-pool-api.service';
import { EnvironmentsService } from '@services/utility/environments.service';
import { ILiquidityPoolEntity, IPagination } from '@interfaces/database.interface';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { LiquidityPoolApiService } from '@services/api/smart-contracts/liquidity-pool-api.service';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MiningPool } from '@models/platform/mining-pool';

@Injectable({providedIn: 'root'})
export class LiquidityPoolService {
  constructor(
    private _liquidityPoolApi: LiquidityPoolApiService,
    private _poolRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _env: EnvironmentsService,
    private _miningPoolApi: MiningPoolApiService
  ) { }

  public async buildLiquidityPool(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPoolBySrcToken(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolBySrcAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPoolByMiningPoolAddress(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByMiningPoolAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPools(skip: number, take: number): Promise<IPagination<LiquidityPool>> {
    const result = await this._poolRepository.getPools(skip, take);
    const pools = await Promise.all(result.results.map(entity => this._buildLiquidityPool(entity)));
    return { skip: result.skip, take: result.take, results: pools, count: result.count };
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

    const hydrated = await firstValueFrom(this._liquidityPoolApi.getHydratedPool(entity.address, entity.miningPool));

    let miningPool = null;
    if (entity.srcToken !== this._env.contracts.odx) {
      const miningPoolDto = await firstValueFrom(this._miningPoolApi.getHydratedMiningPool(entity.miningPool));
      miningPool = new MiningPool(miningPoolDto);
    }

    const srcToken = await this._tokenService.buildToken(entity.srcToken);
    const stakingToken = await this._tokenService.buildToken(this._env.contracts.odx);
    const crsToken = await this._tokenService.buildToken('CRS');
    const lpToken = await this._tokenService.buildToken(entity.address);

    return new LiquidityPool(entity, hydrated, miningPool, srcToken, stakingToken, crsToken, lpToken);
  }
}
