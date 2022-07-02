export enum LiquidityPoolMethods {
  // Base Liquidity Pool
  Mint = 'Mint',
  Burn = 'Burn',
  Swap = 'Swap',
  Skim = 'Skim',
  Sync = 'Sync',

  // Staking Pool
  GetStoredRewardPerStakedToken = 'GetStoredRewardPerStakedToken',
  GetStoredReward = 'GetStoredReward',
  GetRewardPerStakedToken = 'GetRewardPerStakedToken',
  GetStakedBalance = 'GetStakedBalance',
  GetStakingRewards = 'GetStakingRewards',
  StartStaking = 'StartStaking',
  StopStaking = 'StopStaking',
  CollectStakingRewards = 'CollectStakingRewards'
}
