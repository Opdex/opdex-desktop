import { IPagination, ITokenEntity } from '@interfaces/database.interface';
import { Injectable, Injector } from "@angular/core";
import { OpdexDB } from "./db.service";
import { CacheService } from '@services/utility/cache.service';
import { from, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class TokenRepositoryService extends CacheService {
  constructor(
    protected _injector: Injector,
    private _db: OpdexDB
  ) {
    super(_injector);
  }

  getTokenByAddress(address: string): Observable<ITokenEntity> {
    return this.getItem<ITokenEntity>(address, from(this._db.token.get({ address })), 10);
  }

  async searchTokens(keyword: string): Promise<ITokenEntity[]> {
    return await this._db.token
      .where('address').equals(keyword)
      .or('symbol').startsWithIgnoreCase(keyword)
      .or('name').startsWithIgnoreCase(keyword)
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
