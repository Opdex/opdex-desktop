interface IOwnershipLog {
  from: string;
  to: string;
}

///////////////////////////////////////
// Deployer Logs
///////////////////////////////////////

export interface IClaimPendingDeployerOwnershipLog extends IOwnershipLog { }

export interface ISetPendingDeployerOwnershipLog extends IOwnershipLog { }

export interface ICreateMarketLog {
  market: string;
  owner: string;
  router: string;
  stakingToken: string;
  authPoolCreators: boolean;
  authProviders: boolean;
  authTraders: boolean;
  transactionFee: number;
  marketFeeEnabled: boolean;
}

///////////////////////////////////////
// Market Logs
///////////////////////////////////////

export interface IChangeMarketPermissionLog {
  address: string;
  permission: number;
  isAuthorized: boolean;
}

export interface IClaimPendingMarketOwnershipLog extends IOwnershipLog { }

export interface ISetPendingMarketOwnershipLog extends IOwnershipLog { }

export interface ICreateLiquidityPoolLog {
  token: string;
  pool: string;
}

///////////////////////////////////////
// Standard Pool Logs
///////////////////////////////////////

export interface IApprovalLog {
  owner: string;
  spender: string;
  amount: BigInt;
  oldAmount: BigInt;
}

interface IBurnAndMintLog {
  sender: string;
  to: string;
  amountCrs: BigInt;
  amountSrc: BigInt;
  amountLpt: BigInt;
  totalSupply: BigInt;
}

export interface IBurnLog extends IBurnAndMintLog { }

export interface IMintLog extends IBurnAndMintLog { }

export interface IReservesLog {
  reserveCrs: BigInt;
  reserveSrc: BigInt;
}

export interface ISwapLog {
  sender: string;
  to: string;
  amountCrsIn: BigInt;
  amountSrcIn: BigInt;
  amountCrsOut: BigInt;
  amountSrcOut: BigInt;
}

export interface ITransferLog {
  from: string;
  to: string;
  amount: BigInt;
}

///////////////////////////////////////
// Staking Pool Logs
///////////////////////////////////////

export interface ICollectStakingRewardsLog {
  staker: string;
  amount: BigInt;
}

interface IStakingLog {
  staker: string;
  amount: BigInt;
  totalStaked: BigInt;
  stakerBalance: BigInt;
}

export interface IStartStakingLog extends IStakingLog { }

export interface IStopStakingLog extends IStakingLog { }

///////////////////////////////////////
// Mining Pool Logs
///////////////////////////////////////

export interface ICollectMiningRewardsLog {
  miner: string;
  amount: BigInt;
}

export interface IEnableMiningLog {
  amount: BigInt;
  rewardRate: BigInt;
  miningPeriodEndBlock: number;
}

interface IMiningLog {
  miner: string;
  amount: BigInt;
  totalSupply: BigInt;
  minerBalance: BigInt;
}

export interface IStartMiningLog extends IMiningLog { }

export interface IStopMiningLog extends IMiningLog { }

///////////////////////////////////////
// Mined Token
///////////////////////////////////////

export interface IDistributionLog {
  periodIndex: number;
  vaultAmount: BigInt;
  miningAmount: BigInt;
  totalSupply: BigInt;
  nextDistributionBlock: number;
}

///////////////////////////////////////
// Mining Governance
///////////////////////////////////////

export interface INominationLog {
  stakingPool: string;
  miningPool: string;
  weight: BigInt;
}

export interface IRewardMiningPoolLog {
  stakingPool: string;
  miningPool: string;
  amount: BigInt;
}

///////////////////////////////////////
// Vault
///////////////////////////////////////

export interface ICompleteVaultProposalLog {
  proposalId: number;
  approved: boolean;
}

interface ICertificateLog {
  owner: string;
  amount: BigInt;
  vestedBlock: number;
}

export interface ICreateVaultProposalLog {
  proposalId: number;
  wallet: string;
  amount: BigInt;
  type: number;
  status: number;
  expiration: number;
  description: string;
}

export interface ICreateVaultCertificateLog extends ICertificateLog { }

export interface IRedeemVaultCertificateLog extends ICertificateLog { }

export interface IRevokeVaultCertificateLog {
  owner: string;
  oldAmount: BigInt;
  newAmount: BigInt;
  vestedBlock: number;
}

export interface IVaultProposalPledgeLog {
  proposalId: number;
  pledger: string;
  pledgeAmount: BigInt;
  pledgerAmount: BigInt;
  proposalPledgeAmount: BigInt;
  totalPledgeMinimumMet: boolean;
}

export interface IVaultProposalVoteLog {
  proposalId: number;
  voter: string;
  inFavor: boolean;
  voteAmount: BigInt;
  voterAmount: BigInt;
  proposalYesAmount: BigInt;
  proposalNoAmount: boolean;
}

export interface IVaultProposalWithdrawPledgeLog {
  proposalId: number;
  pledger: string;
  withdrawAmount: BigInt;
  pledgerAmount: BigInt;
  proposalPledgeAmount: BigInt;
  pledgeWithdrawn: boolean;
}

export interface IVaultProposalWithdrawVoteLog {
  proposalId: number;
  voter: string;
  withdrawAmount: BigInt;
  voterAmount: BigInt;
  proposalYesAmount: BigInt;
  proposalNoAmount: BigInt;
  voteWithdrawn: boolean;
}
