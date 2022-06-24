import { ITokenEntity } from './../../interfaces/database.interface';
import { Injectable } from "@angular/core";
import { db } from "./db.service";

@Injectable({providedIn: 'root'})
export class TokenRepositoryService {
  constructor() {

  }

  async getTokenByAddress(address: string) {
    return await db.token.get({ address });
  }

  async persistTokens(tokens: ITokenEntity[]) {
    const entities = await db.token.toArray();

    await db.token.bulkPut(tokens.map(token => {
      return {
        ...token,
        id: entities.find(entity => entity.address === token.address)?.id
      }
    }));
  }
}
