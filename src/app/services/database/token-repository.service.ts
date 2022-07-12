import { ITokenEntity } from '@interfaces/database.interface';
import { Injectable } from "@angular/core";
import { OpdexDB } from "./db.service";

@Injectable({providedIn: 'root'})
export class TokenRepositoryService {
  constructor(private _db: OpdexDB) { }

  async getTokenByAddress(address: string) {
    return await this._db.token.get({ address });
  }

  async getTokens() {
    return await this._db.token.toArray();
  }

  async persistTokens(tokens: ITokenEntity[]) {
    console.log(tokens)
    const entities = await this._db.token.toArray();

    await this._db.token.bulkPut(tokens.map(token => {
      return {
        ...token,
        id: entities.find(entity => entity.address === token.address)?.id
      }
    }));
  }
}
