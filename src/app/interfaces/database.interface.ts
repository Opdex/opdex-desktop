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
  description: string;
  wallet: string;
}

export interface IVaultCertificateEntity {
  id?: number;
  owner: string;
  amount: BigInt;
  redeemed: number; // 0 false - 1 true
  revoked: number; // 0 false - 1 true
  createdBlock: number;
  vestedBlock: number;
}
