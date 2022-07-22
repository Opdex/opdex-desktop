import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { IPagination, ITokenEntity } from '@interfaces/database.interface';
import { Token } from '@models/platform/token';
import { Injectable } from "@angular/core";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { TokenService } from "@services/platform/token.service";
import { firstValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class TokenFactoryService {
  constructor(
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _liquidityPoolRepository: PoolRepositoryService
  ) { }

  public async buildTokens(skip: number, take: number): Promise<IPagination<Token>> {
    const result = await this._tokenRepository.getTokens(skip, take);
    const tokens = await Promise.all(result.results.map(entity => this._buildToken(entity)));
    return { skip: result.skip, take: result.take, results: tokens, count: result.count }
  }

  public async buildToken(address: string): Promise<Token> {
    let entity: ITokenEntity = address === 'CRS'
      ? { address: 'CRS', symbol: 'CRS', name: 'Cirrus', decimals: 8, createdBlock: 1 }
      : await this._tokenRepository.getTokenByAddress(address);

    let isLpt = false;

    if (entity === undefined) {
      const pool = await this._liquidityPoolRepository.getPoolByAddress(address);

      if (pool !== undefined) {
        entity = { address, symbol: 'OLPT', name: 'Liquidity Pool Token', decimals: 8, createdBlock: pool.createdBlock }
        isLpt = true;
      } else {
        return undefined;
      }
    }

    return await this._buildToken(entity, isLpt);
  }

  private async _buildToken(entity: ITokenEntity, lpToken: boolean = false): Promise<Token> {
    const hydrated = entity.address === 'CRS'
      ? { totalSupply: BigInt('10000000000000000') }
      : await firstValueFrom(this._tokenService.getHydratedToken(entity.address, lpToken));

    const pricing = await this._tokenService.getTokenPricing(entity);

    return new Token(entity, hydrated, pricing);
  }
}
