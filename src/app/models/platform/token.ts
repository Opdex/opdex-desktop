import { ITokenEntity } from '@interfaces/database.interface';

export class Token {
  name: string;
  symbol: string;
  decimals: number;
  sats: BigInt;

  constructor(entity: ITokenEntity) {
    this.name = entity.name;
    this.symbol = entity.symbol;
    this.decimals = entity.decimals;
    this.sats = BigInt(entity.sats);
  }
}
