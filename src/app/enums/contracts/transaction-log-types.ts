export enum TransactionLogTypes {
  // Deployer
  ClaimPendingDeployerOwnershipLog = 'ClaimPendingDeployerOwnershipLog',
  CreateMarketLog = 'CreateMarketLog',
  SetPendingDeployerOwnershipLog = 'SetPendingDeployerOwnershipLog',

  // Market
  ChangeMarketPermissionLog = 'ChangeMarketPermissionLog.cs',
  ClaimPendingMarketOwnershipLog = 'ClaimPendingMarketOwnershipLog',
  CreateLiquidityPoolLog = 'CreateLiquidityPoolLog',
  SetPendingMarketOwnershipLog = 'SetPendingMarketOwnershipLog',

  // Liquidity Pool
  BurnLog = 'BurnLog',
  MintLog = 'MintLog',
  ReservesLog = 'ReservesLog',
  SwapLog = 'SwapLog',

  // Staking Pool
  CollectStakingRewardsLog = 'CollectStakingRewardsLog',
  StartStakingLog = 'StartStakingLog',
  StopStakingLog = 'StopStakingLog',

  // Mining Pool
  CollectMiningRewardsLog = 'CollectMiningRewardsLog',
  StartMiningLog = 'StartMiningLog',
  StopMiningLog = 'StopMiningLog',
  EnableMiningLog = 'EnableMiningLog',

  // Shared
  ApprovalLog = 'ApprovalLog',
  TransferLog = 'TransferLog',

  // Mined Token
  DistributionLog = 'DistributionLog',

  // Mining Governance
  NominationLog = 'NominationLog',
  RewardMiningPoolLog = 'RewardMiningPoolLog',

  // Vault
  CreateVaultProposalLog = 'CreateVaultProposalLog',
  CreateVaultCertificateLog = 'CreateVaultCertificateLog',
  CompleteVaultProposalLog = 'CompleteVaultProposalLog',
  RedeemVaultCertificateLog = 'RedeemVaultCertificateLog',
  RevokeVaultCertificateLog = 'RevokeVaultCertificateLog',
  VaultProposalPledgeLog = 'VaultProposalPledgeLog',
  VaultProposalVoteLog = 'VaultProposalVoteLog',
  VaultProposalWithdrawPledgeLog = 'VaultProposalWithdrawPledgeLog',
  VaultProposalWithdrawVoteLog = 'VaultProposalWithdrawVoteLog'
}
