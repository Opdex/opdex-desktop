export interface IIndexerEntity {
  id: number;
  lastUpdateBlock: number;
}

export interface ILiquidityPoolEntity {
  id?: number;
  address: string;
  name: string;
  srcToken: string;
  miningPool: string;
  transactionFee: number;
}

export interface ITokenEntity {
  id?: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  nativeChain?: string;
  nativeChainAddress?: string;
}
