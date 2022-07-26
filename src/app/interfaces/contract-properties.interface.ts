////////////////////////////////
// Liquidity Pool
////////////////////////////////

export interface IBaseLiquidityPoolDetailsDto {
  address: string;
  token: string;
  miningPool: string;
  transactionFee: number;
}

export interface IHydratedLiquidityPoolDetailsDto {
  address: string;
  totalSupply: BigInt;
  reserveCrs: BigInt;
  reserveSrc: BigInt;
  totalStaked: BigInt;
  miningPeriodEndBlock: number;
}

export interface IMiningPoolDetailsDto {
  address: string;
  stakingToken: string;
  miningPeriodEndBlock: number;
  rewardRate: BigInt;
  totalSupply: BigInt;
}

////////////////////////////////
// Token
////////////////////////////////

export interface ITokenDetailsDto {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigInt;
  nativeChain: string;
  nativeChainAddress: string;
}

export interface IHydratedTokenDetailsDto {
  totalSupply: BigInt;
  nextDistributionBlock?: number;
  periodDuration?: number;
  periodIndex?: number;
}

////////////////////////////////
// Vault
////////////////////////////////

export interface IHydratedVault {
  token: string;
  totalSupply: BigInt;
  vestingDuration: number;
  totalProposedAmount: BigInt;
  totalPledgeMinimum: BigInt;
  totalVoteMinimum: BigInt;
  balance: BigInt;
}

export interface IHydratedProposal {
  amount: BigInt;
  type: number;
  status: number;
  wallet: string;
  expiration: number;
  pledgeAmount: BigInt;
  noAmount: BigInt;
  yesAmount: BigInt;
}
