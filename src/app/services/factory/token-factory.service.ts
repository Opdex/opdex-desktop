import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { ITokenEntity } from '@interfaces/database.interface';
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

  public async buildTokens(): Promise<Token[]> {
    const entities = await this._tokenRepository.getTokens();
    return await Promise.all(entities.map(entity => this._buildToken(entity)));
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
