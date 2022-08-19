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
  isNominated: number;
  miningPeriodEndBlock: number;
  createdBlock: number;
}

export interface ITokenEntity {
  id?: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  nativeChain?: string;
  nativeChainAddress?: string;
  createdBlock: number;
}

export interface IVaultProposalEntity {
  id?: number;
  proposalId: number;
  createdBlock: number;
  type: number;
  approved: number;
  description: string;
  wallet: string;
  creator: string;
}

export interface IVaultCertificateEntity {
  id?: number;
  owner: string;
  amount: BigInt;
  redeemed: number; // 0 false - 1 true
  revoked: number; // 0 false - 1 true
  proposalId: number;
  createdBlock: number;
  vestedBlock: number;
}

export interface IPagination<T> {
  skip: number;
  take: number;
  count: number;
  results: T[];
}
