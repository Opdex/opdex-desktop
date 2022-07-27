import { IPagination, ITokenEntity } from '@interfaces/database.interface';
import { Injectable } from "@angular/core";
import { OpdexDB } from "./db.service";

@Injectable({providedIn: 'root'})
export class TokenRepositoryService {
  constructor(private _db: OpdexDB) { }

  async getTokenByAddress(address: string) {
    return await this._db.token.get({ address });
  }

  async searchTokens(keyword: string): Promise<ITokenEntity[]> {
    return await this._db.token
      .where('address').equals(keyword)
      .or('symbol').startsWith(keyword)
      .or('name').startsWith(keyword)
      .toArray();
  }

  async getTokens(skip: number = 0, take: number = 10): Promise<IPagination<ITokenEntity>> {
    const count = await this._db.token.count();
    const results = await this._db.token.offset(skip).limit(take).toArray();
    return { skip, take, results, count };
  }

  async persistTokens(tokens: ITokenEntity[]) {
    const entities = await this._db.token.toArray();

    await this._db.token.bulkPut(tokens.map(token => {
      return {
        ...token,
        id: entities.find(entity => entity.address === token.address)?.id
      }
    }));
  }
}
