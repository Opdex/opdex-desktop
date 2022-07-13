import { ITokenEntity } from '@interfaces/database.interface';
import { Token } from '@models/platform/token';
import { Injectable } from "@angular/core";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { TokenService } from "@services/platform/token.service";
import { lastValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class TokenFactoryService {
  constructor(
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
  ) { }

  public async buildTokens(): Promise<Token[]> {
    const entities = await this._tokenRepository.getTokens();
    return await Promise.all(entities.map(entity => this._buildToken(entity)));
  }

  public async buildToken(address: string): Promise<Token> {
    const entity = await this._tokenRepository.getTokenByAddress(address);
    return await this._buildToken(entity);
  }

  private async _buildToken(entity: ITokenEntity): Promise<Token> {
    const hydrated = await lastValueFrom(this._tokenService.getHydratedToken(entity.address));
    return new Token(entity, hydrated);
  }
}
