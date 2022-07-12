import { Token } from '@models/platform/token';
import { Injectable } from "@angular/core";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { TokenService } from "@services/platform/token.service";

@Injectable({providedIn: 'root'})
export class TokenFactoryService {
  constructor(
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
  ) { }

  public async buildTokens() {
    const entities = await this._tokenRepository.getTokens();
    // Todo: hydrated portions
    return entities.map(entity => new Token(entity))
  }
}
