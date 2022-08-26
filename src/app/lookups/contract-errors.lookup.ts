export function ParseFriendlyErrorMessage(input: string): string {
  if (!input) return null;

  const error = tryMatchOpdexError(input);

  return !!error
    ? tryParseFriendlyOpdexErrorMessage(input, error)
    : tryParseFriendlyOverflowMessage(input);
}

const BaseContractErrors = {
  invalidMarket: 'INVALID_MARKET',
  invalidRouter: 'INVALID_ROUTER',
  unauthorized: 'UNAUTHORIZED',
  failedToSetMarketOwner: 'SET_OWNER_FAILURE',
  failedToAuthorizeRouter: 'AUTH_ROUTER_FAILURE',
  invalidStakingToken: 'INVALID_STAKING_TOKEN',
  invalidToken: 'INVALID_TOKEN',
  poolAlreadyExistsOnMarket: 'POOL_EXISTS',
  invalidPool: 'INVALID_POOL',
  permissionOutsideOfValidRange: 'INVALID_PERMISSION',
  mintFailed: 'INVALID_MINT_RESPONSE',
  insufficientCrsAmount: 'INSUFFICIENT_CRS_AMOUNT',
  insufficientSrcAmount: 'INSUFFICIENT_SRC_AMOUNT',
  excessiveInputAmount: 'EXCESSIVE_INPUT_AMOUNT',
  insufficientAmount: 'INSUFFICIENT_AMOUNT',
  insufficientInputAmount: 'INSUFFICIENT_INPUT_AMOUNT',
  insufficientOutputAmount: 'INSUFFICIENT_OUTPUT_AMOUNT',
  insufficientLiquidity: 'INSUFFICIENT_LIQUIDITY',
  insufficientPrimaryAmount: 'INSUFFICIENT_A_AMOUNT',
  insufficientSecondaryAmount: 'INSUFFICIENT_B_AMOUNT',
  transferFailed: 'INVALID_TRANSFER',
  transferFromFailed: 'INVALID_TRANSFER_FROM',
  transferToFailed: 'INVALID_TRANSFER_TO',
  invalidSwapAttempt: 'INVALID_SWAP_ATTEMPT',
  expiredDeadline: 'EXPIRED_DEADLINE',
  locked: 'LOCKED',
  invalidBalance: 'INVALID_BALANCE',
  insufficientLiquidityBurned: 'INSUFFICIENT_LIQUIDITY_BURNED',
  invalidOutputAmount: 'INVALID_OUTPUT_AMOUNT',
  invalidTo: 'INVALID_TO',
  zeroInputAmount: 'ZERO_INPUT_AMOUNT',
  stakingUnavailable: 'STAKING_UNAVAILABLE',
  cannotStakeZero: 'CANNOT_STAKE_ZERO',
  invalidAmount: 'INVALID_AMOUNT',
  providedRewardTooHigh: 'PROVIDED_REWARD_TOO_HIGH',
  invalidSender: 'INVALID_SENDER',
  invalidDistributionPeriod: 'INVALID_DISTRIBUTION_PERIOD',
  invalidNomination: 'INVALID_NOMINATION',
  duplicateNomination: 'DUPLICATE_NOMINATION',
  distributionNotReady: 'DISTRIBUTION_NOT_READY',
  failedGovernanceDistribution: 'FAILED_GOVERNANCE_DISTRIBUTION',
  failedVaultDistribution: 'FAILED_VAULT_DISTRIBUTION',
  nominationPeriodActive: 'NOMINATION_PERIOD_ACTIVE',
  tokenDistributionRequired: 'TOKEN_DISTRIBUTION_REQUIRED',
  certificateExists: 'CERTIFICATE_EXISTS',
  insufficientVaultSupply: 'INSUFFICIENT_VAULT_SUPPLY',
  invalidCertificate: 'INVALID_CERTIFICATE',
  insufficientPledgeAmount: 'INSUFFICIENT_PLEDGE_AMOUNT',
  invalidStatus: 'INVALID_STATUS',
  proposalExpired: 'PROPOSAL_EXPIRED',
  insufficientVoteAmount: 'INSUFFICIENT_VOTE_AMOUNT',
  alreadyVotedNotInFavor: 'ALREADY_VOTED_NOT_IN_FAVOR',
  alreadyVotedInFavor: 'ALREADY_VOTED_IN_FAVOR',
  invalidProposal: 'INVALID_PROPOSAL',
  alreadyComplete: 'ALREADY_COMPLETE',
  proposalInProgress: 'PROPOSAL_IN_PROGRESS',
  certificateNotFound: 'CERTIFICATE_NOT_FOUND',
  certificateVesting: 'CERTIFICATE_VESTING',
  recipientProposalInProgress: 'RECIPIENT_PROPOSAL_IN_PROGRESS',
  excessiveAmount: 'EXCESSIVE_AMOUNT',
  invalidDescription: 'INVALID_DESCRIPTION',
  notPayable: 'NOT_PAYABLE',
  insufficientDeposit: 'INSUFFICIENT_DEPOSIT',
  invalidCreator: 'INVALID_CREATOR',
  insufficientWithdrawAmount: 'INSUFFICIENT_WITHDRAW_AMOUNT',
  insufficientFunds: 'INSUFFICIENT_FUNDS'
}

const ContractErrorMethods = {
  // Deployer
  deployerSetOwnership: 'OpdexMarketDeployer.SetPendingOwnership(Address pendingOwner)',
  deployerClaimOwnership: 'OpdexMarketDeployer.ClaimPendingOwnership()',
  deployerCreateStandardMarket: 'OpdexMarketDeployer.CreateStandardMarket(Address marketOwner, UInt32 transactionFee, Boolean authPoolCreators, Boolean authProviders, Boolean authTraders, Boolean enableMarketFee)',
  deployerCreateStakingMarket: 'OpdexMarketDeployer.CreateStakingMarket(Address stakingToken)',

  // Standard Market
  standardMarketAuthorize: 'OpdexStandardMarket.Authorize(Address address, byte permission, Boolean authorize)',
  standardMarketSetOwnership: 'OpdexStandardMarket.SetPendingOwnership(Address pendingOwner)',
  standardMarketClaimOwnership: 'OpdexStandardMarket.ClaimPendingOwnership()',
  standardMarketCreatePool: 'OpdexStandardMarket.CreatePool(Address token)',
  standardMarketCollectFees: 'OpdexStandardMarket.CollectMarketFees(Address token, UInt256 amount)',

  // Staking Market
  stakingMarketCreatePool: 'OpdexStakingMarket.CreatePool(Address token)',

  // Router
  routerAddLiquidity: 'OpdexRouter.AddLiquidity(Address token, UInt256 amountSrcDesired, UInt64 amountCrsMin, UInt256 amountSrcMin, Address to, UInt64 deadline)',
  routerRemoveLiquidity: 'OpdexRouter.RemoveLiquidity(Address token, UInt256 liquidity, UInt64 amountCrsMin, UInt256 amountSrcMin, Address to, UInt64 deadline)',
  routerSwapExactCrsForSrc: 'OpdexRouter.SwapExactCrsForSrc(UInt256 amountSrcOutMin, Address token, Address to, UInt64 deadline)',
  routerSwapSrcForExactCrs: 'OpdexRouter.SwapSrcForExactCrs(UInt64 amountCrsOut, UInt256 amountSrcInMax, Address token, Address to, UInt64 deadline)',
  routerSwapExactSrcForCrs: 'OpdexRouter.SwapExactSrcForCrs(UInt256 amountSrcIn, UInt64 amountCrsOutMin, Address token, Address to, UInt64 deadline)',
  routerSwapCrsForExactSrc: 'OpdexRouter.SwapCrsForExactSrc(UInt256 amountSrcOut, Address token, Address to, UInt64 deadline)',
  routerSwapSrcForExactSrc: 'OpdexRouter.SwapSrcForExactSrc(UInt256 amountSrcInMax, Address tokenIn, UInt256 amountSrcOut, Address tokenOut, Address to, UInt64 deadline)',
  routerSwapExactSrcForSrc: 'OpdexRouter.SwapExactSrcForSrc(UInt256 amountSrcIn, Address tokenIn, UInt256 amountSrcOutMin, Address tokenOut, Address to, UInt64 deadline)',
  routerGetLiquidityQuote: 'OpdexRouter.GetLiquidityQuote(UInt256 amountA, UInt256 reserveA, UInt256 reserveB)',
  routerGetAmountOutOneHop: 'OpdexRouter.GetAmountOut(UInt256 amountIn, UInt256 reserveIn, UInt256 reserveOut)',
  routerGetAmountOutMultiHop: 'OpdexRouter.GetAmountOut(UInt256 tokenInAmount, UInt256 tokenInReserveCrs, UInt256 tokenInReserveSrc, UInt256 tokenOutReserveCrs, UInt256 tokenOutReserveSrc)',
  routerGetAmountInOneHop: 'OpdexRouter.GetAmountIn(UInt256 amountOut, UInt256 reserveIn, UInt256 reserveOut)',
  routerGetAmountInMultiHop: 'OpdexRouter.GetAmountIn(UInt256 tokenOutAmount, UInt256 tokenOutReserveCrs, UInt256 tokenOutReserveSrc, UInt256 tokenInReserveCrs, UInt256 tokenInReserveSrc)',

  // Standard Pool
  standardPoolMint: 'OpdexStandardPool.Mint(Address to)',
  standardPoolBurn: 'OpdexStandardPool.Burn(Address to)',
  standardPoolSwap: 'OpdexStandardPool.Swap(UInt64 amountCrsOut, UInt256 amountSrcOut, Address to, Byte[] data)',
  standardPoolSkim: 'OpdexStandardPool.Skim(Address to)',
  standardPoolSync: 'OpdexStandardPool.Sync()',

  // Staking Pool
  stakingPoolStartStaking: 'OpdexStakingPool.StartStaking(UInt256 amount)',
  stakingPoolCollectStakingRewards: 'OpdexStakingPool.CollectStakingRewards(Boolean liquidate)',
  stakingPoolStopStaking: 'OpdexStakingPool.StopStaking(UInt256 amount, Boolean liquidate)',
  stakingPoolMint: 'OpdexStakingPool.Mint(Address to)',
  stakingPoolBurn: 'OpdexStakingPool.Burn(Address to)',
  stakingPoolSwap: 'OpdexStakingPool.Swap(UInt64 amountCrsOut, UInt256 amountSrcOut, Address to, Byte[] data)',
  stakingPoolSkim: 'OpdexStakingPool.Skim(Address to)',
  stakingPoolSync: 'OpdexStakingPool.Sync()',

  // Mining Pool
  miningPoolStartMining: 'OpdexMiningPool.StartMining(UInt256 amount)',
  miningPoolCollectMiningRewards: 'OpdexMiningPool.CollectMiningRewards()',
  miningPoolStopMining: 'OpdexMiningPool.StopMining(UInt256 amount)',
  miningPoolNotifyRewardAmount: 'OpdexMiningPool.NotifyRewardAmount(UInt256 reward)',

  // Mined Token
  minedTokenNominateLiquidityPool: 'OpdexMinedToken.NominateLiquidityPool()',
  minedTokenDistribute: 'OpdexMinedToken.Distribute()',
  minedTokenDistributeGenesis: 'OpdexMinedToken.DistributeGenesis(Address firstNomination, Address secondNomination, Address thirdNomination, Address fourthNomination)',
  minedTokenDistributeExecute: 'OpdexMinedToken.DistributeExecute(UInt32 periodIndex, Address[] nominations)',

  // Mining Governance
  miningGovernanceNotifyDistribution: 'OpdexMiningGovernance.NotifyDistribution(Address firstNomination, Address secondNomination, Address thirdNomination, Address fourthNomination)',
  miningGovernanceNominateLiquidityPool: 'OpdexMiningGovernance.NominateLiquidityPool(Address stakingPool, UInt256 weight)',
  miningGovernanceRewardMiningPools: 'OpdexMiningGovernance.RewardMiningPools()',
  miningGovernanceRewardMiningPool: 'OpdexMiningGovernance.RewardMiningPool()',

  // Vault
  vaultNotifyDistribution: 'OpdexVault.NotifyDistribution(UInt256 amount)',
  vaultCreateNewCertificateProposal: 'OpdexVault.CreateNewCertificateProposal(UInt256 amount, Address recipient, String description)',
  vaultCreateRevokeCertificateProposal: 'OpdexVault.CreateRevokeCertificateProposal(Address recipient, String description)',
  vaultCreateTotalPledgeMinimumProposal: 'OpdexVault.CreateTotalPledgeMinimumProposal(UInt256 amount, String description)',
  vaultCreateTotalVoteMinimumProposal: 'OpdexVault.CreateTotalVoteMinimumProposal(UInt256 amount, String description)',
  vaultPledge: 'OpdexVault.Pledge(UInt64 proposalId)',
  vaultVote: 'OpdexVault.Vote(UInt64 proposalId, Boolean inFavor)',
  vaultWithdrawPledge: 'OpdexVault.WithdrawPledge(UInt64 proposalId, UInt64 withdrawAmount)',
  vaultWithdrawVote: 'OpdexVault.WithdrawVote(UInt64 proposalId, UInt64 withdrawAmount)',
  vaultCompleteProposal: 'OpdexVault.CompleteProposal(UInt64 proposalId)',
  vaultRedeemCertificate: 'OpdexVault.RedeemCertificate()'
}

function evaluateOpdexError(method: string, error: string): string {
  // Deployer
  if (method === ContractErrorMethods.deployerSetOwnership) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to set deployer ownership, unauthorized.';
  }
  else if (method === ContractErrorMethods.deployerClaimOwnership) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to claim deployer ownership, unauthorized.';
  }
  else if (method === ContractErrorMethods.deployerCreateStandardMarket) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to create market, unauthorized.';
    if (error === BaseContractErrors.invalidMarket) return 'Unable to create market, invalid transaction fee.';
    if (error === BaseContractErrors.invalidRouter) return 'Unable to create market, something unexpected happened.'; // should never be raised
    if (error === BaseContractErrors.failedToAuthorizeRouter) return 'Unable to create market, something unexpected happened.'; // should never be raised
    if (error === BaseContractErrors.failedToSetMarketOwner) return 'Unable to create market, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.deployerCreateStakingMarket) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to create market, unauthorized.';
    if (error === BaseContractErrors.invalidStakingToken) return 'Unable to create market, invalid staking token.';
    if (error === BaseContractErrors.invalidMarket) return 'Unable to create market, something unexpected happened.'; // should never be raised
    if (error === BaseContractErrors.invalidRouter) return 'Unable to create market, something unexpected happened.'; // should never be raised
  }
  // Standard Market
  else if (method === ContractErrorMethods.standardMarketAuthorize) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to modify permissions, unauthorized.';
    if (error === BaseContractErrors.permissionOutsideOfValidRange) return 'Unable to modify permissions, unknown permission.';
  }
  else if (method === ContractErrorMethods.standardMarketSetOwnership) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to set market ownership, unauthorized.';
  }
  else if (method === ContractErrorMethods.standardMarketClaimOwnership) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to claim market ownership, unauthorized.';
  }
  else if (method === ContractErrorMethods.standardMarketCreatePool) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to create pool, unauthorized.';
    if (error === BaseContractErrors.invalidToken) return 'Unable to create pool, invalid token.';
    if (error === BaseContractErrors.poolAlreadyExistsOnMarket) return 'Unable to create pool, already exists.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to create pool, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.standardMarketCollectFees) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to collect fees, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to collect fees, no pool exists for token.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to collect fees, not enough funds.';
  }
  // Staking Market
  else if (method === ContractErrorMethods.stakingMarketCreatePool) {
    if (error === BaseContractErrors.invalidToken) return 'Unable to create pool, invalid token.';
    if (error === BaseContractErrors.poolAlreadyExistsOnMarket) return 'Unable to create pool, already exists.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to create pool, something unexpected happened.'; // should never be raised
  }
  // Router
  else if (method === ContractErrorMethods.routerAddLiquidity) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to add liquidity, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to add liquidity, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to add liquidity, invalid pool.';
    if (error === BaseContractErrors.insufficientAmount) return 'Unable to add liquidity, input must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to add liquidity, something unexpected happened.'; // should never be raised
    if (error === BaseContractErrors.insufficientPrimaryAmount) return 'Unable to add liquidity, insufficient CRS amount.';
    if (error === BaseContractErrors.insufficientSecondaryAmount) return 'Unable to add liquidity, insufficient SRC amount.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to add liquidity, returning CRS change failed.'; // should never be raised
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to add liquidity, returning SRC change failed.'; // should never be raised
    if (error === BaseContractErrors.mintFailed) return 'Unable to add liquidity, LP token mint failed.'; // should never be raised
  }
  else if (method === ContractErrorMethods.routerRemoveLiquidity) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to remove liquidity, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to remove liquidity, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to remove liquidity, invalid pool.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to remove liquidity, transferring LP tokens failed.';
    if (error === BaseContractErrors.insufficientCrsAmount) return 'Unable to remove liquidity, insufficient CRS redeemed.';
    if (error === BaseContractErrors.insufficientSrcAmount) return 'Unable to remove liquidity, insufficient SRC redeemed.';
  }
  else if (method === ContractErrorMethods.routerSwapExactCrsForSrc) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to process swap, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to process swap, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to process swap, invalid pool.';
    if (error === BaseContractErrors.insufficientInputAmount) return 'Unable to process swap, insufficient CRS.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to process swap, insufficient liquidity.';
    if (error === BaseContractErrors.insufficientOutputAmount) return 'Unable to process swap, output too low.';
    if (error === BaseContractErrors.invalidSwapAttempt) return 'Unable to process swap, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.routerSwapSrcForExactCrs) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to process swap, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to process swap, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to process swap, invalid pool.';
    if (error === BaseContractErrors.excessiveInputAmount) return 'Unable to process swap, additional input required.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to process swap, insufficient liquidity.';
    if (error === BaseContractErrors.insufficientOutputAmount) return 'Unable to process swap, insufficient output.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to process swap, SRC transfer failed.';
    if (error === BaseContractErrors.invalidSwapAttempt) return 'Unable to process swap, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.routerSwapExactSrcForCrs) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to process swap, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to process swap, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to process swap, invalid pool.';
    if (error === BaseContractErrors.insufficientInputAmount) return 'Unable to process swap, insufficient SRC.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to process swap, insufficient liquidity.';
    if (error === BaseContractErrors.insufficientOutputAmount) return 'Unable to process swap, output too low.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to process swap, SRC transfer failed.';
    if (error === BaseContractErrors.invalidSwapAttempt) return 'Unable to process swap, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.routerSwapCrsForExactSrc) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to process swap, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to process swap, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to process swap, invalid pool.';
    if (error === BaseContractErrors.excessiveInputAmount) return 'Unable to process swap, CRS input too low.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to process swap, insufficient liquidity.';
    if (error === BaseContractErrors.insufficientOutputAmount) return 'Unable to process swap, output must be greater than zero.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to process swap, could not return change.';  // should never be raised
    if (error === BaseContractErrors.invalidSwapAttempt) return 'Unable to process swap, something unexpected happened.';  // should never be raised
  }
  else if (method === ContractErrorMethods.routerSwapSrcForExactSrc) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to process swap, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to process swap, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to process swap, invalid pool.';
    if (error === BaseContractErrors.excessiveInputAmount) return 'Unable to process swap, additional input required.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to process swap, insufficient liquidity.';
    if (error === BaseContractErrors.insufficientOutputAmount) return 'Unable to process swap, output must be greater than zero.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to process swap, SRC transfer failed.'; // should never be raised
    if (error === BaseContractErrors.invalidSwapAttempt) return 'Unable to process swap, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.routerSwapExactSrcForSrc) {
    if (error === BaseContractErrors.expiredDeadline) return 'Unable to process swap, deadline expired.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to process swap, unauthorized.';
    if (error === BaseContractErrors.invalidPool) return 'Unable to process swap, invalid pool.';
    if (error === BaseContractErrors.insufficientInputAmount) return 'Unable to process swap, insufficient SRC input.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to process swap, insufficient liquidity.';
    if (error === BaseContractErrors.insufficientOutputAmount) return 'Unable to process swap, output too low.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to process swap, SRC transfer failed.'; // should never be raised
    if (error === BaseContractErrors.invalidSwapAttempt) return 'Unable to process swap, something unexpected happened.'; // should never be raised
  }
  else if (method === ContractErrorMethods.routerGetLiquidityQuote) {
    if (error === BaseContractErrors.insufficientAmount) return 'Unable to get quote, input must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to get quote, insufficient liquidity.';
  }
  else if (method === ContractErrorMethods.routerGetAmountOutOneHop) {
    if (error === BaseContractErrors.insufficientAmount) return 'Unable to get quote, input must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to get quote, insufficient liquidity.';
  }
  else if (method === ContractErrorMethods.routerGetAmountOutMultiHop) {
    if (error === BaseContractErrors.insufficientAmount) return 'Unable to get quote, input must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to get quote, insufficient liquidity.';
  }
  else if (method === ContractErrorMethods.routerGetAmountInOneHop) {
    if (error === BaseContractErrors.insufficientAmount) return 'Unable to get quote, output must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to get quote, insufficient liquidity.';
  }
  else if (method === ContractErrorMethods.routerGetAmountInMultiHop) {
    if (error === BaseContractErrors.insufficientAmount) return 'Unable to get quote, output must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to get quote, insufficient liquidity.';
  }
  // Standard Pool
  else if (method === ContractErrorMethods.standardPoolMint) {
    if (error === BaseContractErrors.locked) return 'Unable to mint, locked.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to mint, unauthorized.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to mint, could not get SRC balance.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to mint, insufficient liquidity.';
  }
  else if (method === ContractErrorMethods.standardPoolBurn) {
    if (error === BaseContractErrors.locked) return 'Unable to burn, locked.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to burn, unauthorized.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to burn, could not get SRC balance.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to burn, insufficient liquidity.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to burn, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to burn, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.standardPoolSwap) {
    if (error === BaseContractErrors.locked) return 'Unable to swap, locked.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to swap, unauthorized.';
    if (error === BaseContractErrors.invalidOutputAmount) return 'Unable to swap, CRS or SRC output must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to swap, insufficient liquidity.';
    if (error === BaseContractErrors.invalidTo) return 'Unable to swap, invalid output address.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to swap, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to swap, SRC transfer failed.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to swap, could not get SRC balance.';
    if (error === BaseContractErrors.zeroInputAmount) return 'Unable to swap, reserves cannot drop to zero.';
    if (error === BaseContractErrors.insufficientInputAmount) return 'Unable to swap, constant product cannot change.';
  }
  else if (method === ContractErrorMethods.standardPoolSkim) {
    if (error === BaseContractErrors.locked) return 'Unable to skim, locked.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to skim, unauthorized.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to skim, could not get SRC balance.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to skim, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to skim, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.standardPoolSync) {
    if (error === BaseContractErrors.locked) return 'Unable to sync, locked.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to sync, unauthorized.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to sync, could not get SRC balance.';
  }
  //Staking Pool
  else if (method === ContractErrorMethods.stakingPoolStartStaking) {
    if (error === BaseContractErrors.locked) return 'Unable to start staking, locked.';
    if (error === BaseContractErrors.stakingUnavailable) return 'Unable to start staking, unavailable.';
    if (error === BaseContractErrors.cannotStakeZero) return 'Unable to start staking, amount must be greater than zero.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to start staking, staking token transfer failed.';
  }
  else if (method === ContractErrorMethods.stakingPoolCollectStakingRewards) {
    if (error === BaseContractErrors.locked) return 'Unable to collect rewards, locked.';
    if (error === BaseContractErrors.stakingUnavailable) return 'Unable to collect rewards, unavailable.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to collect rewards, could not get SRC balance.';
    if (error === BaseContractErrors.insufficientLiquidityBurned) return 'Unable to collect rewards, insufficient liquidity.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to collect rewards, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to collect rewards, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.stakingPoolStopStaking) {
    if (error === BaseContractErrors.locked) return 'Unable to stop staking, locked.';
    if (error === BaseContractErrors.stakingUnavailable) return 'Unable to stop staking, unavailable.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to stop staking, invalid amount.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to stop staking, could not get SRC balance.';
    if (error === BaseContractErrors.insufficientLiquidityBurned) return 'Unable to stop staking, insufficient liquidity.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to stop staking, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to stop staking, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.stakingPoolMint) {
    if (error === BaseContractErrors.locked) return 'Unable to mint, locked.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to mint, could not get SRC balance.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to mint, insufficient liquidity.';
  }
  else if (method === ContractErrorMethods.stakingPoolBurn) {
    if (error === BaseContractErrors.locked) return 'Unable to burn, locked.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to burn, could not get SRC balance.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to burn, insufficient liquidity.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to burn, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to burn, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.stakingPoolSwap) {
    if (error === BaseContractErrors.locked) return 'Unable to swap, locked.';
    if (error === BaseContractErrors.invalidOutputAmount) return 'Unable to swap, CRS or SRC output must be greater than zero.';
    if (error === BaseContractErrors.insufficientLiquidity) return 'Unable to swap, insufficient liquidity.';
    if (error === BaseContractErrors.invalidTo) return 'Unable to swap, invalid output address.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to swap, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to swap, SRC transfer failed.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to swap, could not get SRC balance.';
    if (error === BaseContractErrors.zeroInputAmount) return 'Unable to swap, reserves cannot drop to zero.';
    if (error === BaseContractErrors.insufficientInputAmount) return 'Unable to swap, constant product cannot change.';
  }
  else if (method === ContractErrorMethods.stakingPoolSkim) {
    if (error === BaseContractErrors.locked) return 'Unable to skim, locked.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to skim, could not get SRC balance.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to skim, CRS transfer failed.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to skim, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.stakingPoolSync) {
    if (error === BaseContractErrors.locked) return 'Unable to sync, locked.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to sync, could not get SRC balance.';
  }
  // Mining Pool
  else if (method === ContractErrorMethods.miningPoolStartMining) {
    if (error === BaseContractErrors.locked) return 'Unable to start mining, locked.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to start mining, amount must be greater than zero.';
    if (error === BaseContractErrors.transferFromFailed) return 'Unable to start mining, mining token transfer failed.';
  }
  else if (method === ContractErrorMethods.miningPoolCollectMiningRewards) {
    if (error === BaseContractErrors.locked) return 'Unable to collect rewards, locked.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to collect rewards, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.miningPoolStopMining) {
    if (error === BaseContractErrors.locked) return 'Unable to stop mining, locked.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to stop mining, invalid amount';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to stop mining, SRC transfer failed.';
  }
  else if (method === ContractErrorMethods.miningPoolNotifyRewardAmount) {
    if (error === BaseContractErrors.locked) return 'Unable to notify, locked.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to notify, unauthorized.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to notify, could not get SRC balance.';
    if (error === BaseContractErrors.providedRewardTooHigh) return 'Unable to notify, reward too high.';
  }
  // Mined Token
  else if (method === ContractErrorMethods.minedTokenNominateLiquidityPool) {
    if (error === BaseContractErrors.invalidSender) return 'Unable to nominate liquidity pool, invalid sender.';
  }
  else if (method === ContractErrorMethods.minedTokenDistributeGenesis) {
    if (error === BaseContractErrors.invalidDistributionPeriod) return 'Unable to distribute genesis, already distributed.';
    if (error === BaseContractErrors.unauthorized) return 'Unable to distribute genesis, unauthorized.';
    if (error === BaseContractErrors.invalidNomination) return 'Unable to distribute genesis, nomination(s) invalid.';
    if (error === BaseContractErrors.duplicateNomination) return 'Unable to distribute genesis, duplicate nomination.';
  }
  else if (method === ContractErrorMethods.minedTokenDistribute) {
    if (error === BaseContractErrors.invalidDistributionPeriod) return 'Unable to distribute, genesis not yet distributed.';
  }
  else if (method === ContractErrorMethods.minedTokenDistributeExecute) {
    if (error === BaseContractErrors.distributionNotReady) return 'Unable to distribute, not yet ready.';
    if (error === BaseContractErrors.failedGovernanceDistribution) return 'Unable to distribute, mining governance distribution failed.';
    if (error === BaseContractErrors.failedVaultDistribution) return 'Unable to distribute, vault distribution failed.';
  }
  // Mining Governance
  else if (method === ContractErrorMethods.miningGovernanceNotifyDistribution) {
    if (error === BaseContractErrors.invalidSender) return 'Unable to notify distribution, invalid sender.';
  }
  else if (method === ContractErrorMethods.miningGovernanceNominateLiquidityPool) {
    if (error === BaseContractErrors.invalidSender) return 'Unable to nominate liquidity pool, invalid sender.';
  }
  else if (method === ContractErrorMethods.miningGovernanceRewardMiningPools) {
    if (error === BaseContractErrors.locked) return 'Unable to reward mining pools, locked.';
    if (error === BaseContractErrors.nominationPeriodActive) return 'Unable to reward mining pools, nomination period not yet ended.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to reward mining pools, mined token transfer failed.';
    if (error === BaseContractErrors.tokenDistributionRequired) return 'Unable to reward mining pools, something unexpected happened.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to reward mining pools, something unexpected happened.';
  }
  else if (method === ContractErrorMethods.miningGovernanceRewardMiningPool) {
    if (error === BaseContractErrors.locked) return 'Unable to reward mining pool, locked.';
    if (error === BaseContractErrors.nominationPeriodActive) return 'Unable to reward mining pool, nomination period not yet ended.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to reward mining pool, mined token transfer failed.';
    if (error === BaseContractErrors.tokenDistributionRequired) return 'Unable to reward mining pool, something unexpected happened.';
    if (error === BaseContractErrors.invalidBalance) return 'Unable to reward mining pool, something unexpected happened.';
  }
  // Vault
  else if (method === ContractErrorMethods.vaultNotifyDistribution) {
    if (error === BaseContractErrors.unauthorized) return 'Unable to notify distribution, unauthorized.';
  }
  else if (method === ContractErrorMethods.vaultCreateNewCertificateProposal) {
    if (error === BaseContractErrors.invalidCreator) return 'Unable to create new certificate proposal, proposal creator must not be a smart contract.';
    if (error === BaseContractErrors.insufficientDeposit) return 'Unable to create new certificate proposal, proposal deposit is required.';
    if (error === BaseContractErrors.invalidDescription) return 'Unable to create new certificate proposal, invalid description.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to create new certificate proposal, amount must be greater than zero.';
    if (error === BaseContractErrors.certificateExists) return 'Unable to create new certificate proposal, recipient already has a certificate.';
    if (error === BaseContractErrors.insufficientVaultSupply) return 'Unable to create new certificate proposal, requested value exceeds available vault supply.';
    if (error === BaseContractErrors.recipientProposalInProgress) return 'Unable to create new certificate proposal, recipient already has an active proposal.';
  }
  else if (method === ContractErrorMethods.vaultCreateRevokeCertificateProposal) {
    if (error === BaseContractErrors.invalidCreator) return 'Unable to create revoke certificate proposal, proposal creator must not be a smart contract.';
    if (error === BaseContractErrors.insufficientDeposit) return 'Unable to create revoke certificate proposal, proposal deposit is required.';
    if (error === BaseContractErrors.invalidDescription) return 'Unable to create revoke certificate proposal, invalid description.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to create revoke certificate proposal, amount must be greater than zero.';
    if (error === BaseContractErrors.invalidCertificate) return 'Unable to create revoke certificate proposal, certificate cannot be revoked.';
    if (error === BaseContractErrors.recipientProposalInProgress) return 'Unable to create revoke certificate proposal, recipient already has an active proposal.';
  }
  else if (method === ContractErrorMethods.vaultCreateTotalPledgeMinimumProposal) {
    if (error === BaseContractErrors.invalidCreator) return 'Unable to create total pledge minimum proposal, proposal creator must not be a smart contract.';
    if (error === BaseContractErrors.insufficientDeposit) return 'Unable to create total pledge minimum proposal, proposal deposit is required.';
    if (error === BaseContractErrors.invalidDescription) return 'Unable to create total pledge minimum proposal, invalid description.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to create total pledge minimum proposal, amount must be greater than zero.';
    if (error === BaseContractErrors.excessiveAmount) return 'Unable to create total pledge minimum proposal, proposed amount too high.';
  }
  else if (method === ContractErrorMethods.vaultCreateTotalVoteMinimumProposal) {
    if (error === BaseContractErrors.invalidCreator) return 'Unable to create total vote minimum proposal, proposal creator must not be a smart contract.';
    if (error === BaseContractErrors.insufficientDeposit) return 'Unable to create total vote minimum proposal, proposal deposit is required.';
    if (error === BaseContractErrors.invalidDescription) return 'Unable to create total vote minimum proposal, invalid description.';
    if (error === BaseContractErrors.invalidAmount) return 'Unable to create total vote minimum proposal, amount must be greater than zero.';
    if (error === BaseContractErrors.excessiveAmount) return 'Unable to create total vote minimum proposal, proposed amount too high.';
  }
  else if (method === ContractErrorMethods.vaultPledge) {
    if (error === BaseContractErrors.insufficientPledgeAmount) return 'Unable to pledge, message valid must be greater than zero.';
    if (error === BaseContractErrors.invalidStatus) return 'Unable to pledge, invalid status.';
    if (error === BaseContractErrors.proposalExpired) return 'Unable to pledge, proposal expired.';
  }
  else if (method === ContractErrorMethods.vaultVote) {
    if (error === BaseContractErrors.insufficientVoteAmount) return 'Unable to vote, message value must be greater than zero.';
    if (error === BaseContractErrors.invalidStatus) return 'Unable to vote, invalid status.';
    if (error === BaseContractErrors.proposalExpired) return 'Unable to vote, proposal expired.';
    if (error === BaseContractErrors.alreadyVotedNotInFavor) return 'Unable to vote, currently actively voting not in favor.';
    if (error === BaseContractErrors.alreadyVotedInFavor) return 'Unable to vote, currently actively voting in favor.';
  }
  else if (method === ContractErrorMethods.vaultWithdrawPledge) {
    if (error === BaseContractErrors.notPayable) return 'Unable to withdraw pledge, message value expected to be zero.';
    if (error === BaseContractErrors.insufficientWithdrawAmount) return 'Unable to withdraw pledge, amount must be greater than zero.';
    if (error === BaseContractErrors.insufficientFunds) return 'Unable to withdraw pledge, requested amount exceeds balance.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to withdraw pledge, CRS transfer failed.';
  }
  else if (method === ContractErrorMethods.vaultWithdrawVote) {
    if (error === BaseContractErrors.notPayable) return 'Unable to withdraw vote, message value expected to be zero.';
    if (error === BaseContractErrors.insufficientWithdrawAmount) return 'Unable to withdraw vote, amount must be greater than zero.';
    if (error === BaseContractErrors.insufficientFunds) return 'Unable to withdraw vote, requested amount exceeds balance.';
    if (error === BaseContractErrors.transferFailed) return 'Unable to withdraw vote, CRS transfer failed.';
  }
  else if (method === ContractErrorMethods.vaultCompleteProposal) {
    if (error === BaseContractErrors.notPayable) return 'Unable to complete proposal, message value expected to be zero.';
    if (error === BaseContractErrors.invalidProposal) return 'Unable to complete proposal, not found.';
    if (error === BaseContractErrors.alreadyComplete) return 'Unable to complete proposal, already complete.';
    if (error === BaseContractErrors.proposalInProgress) return 'Unable to complete proposal, not yet expired.';
  }
  else if (method === ContractErrorMethods.vaultRedeemCertificate) {
    if (error === BaseContractErrors.notPayable) return 'Unable to redeem certificate, message value expected to be zero.';
    if (error === BaseContractErrors.certificateNotFound) return 'Unable to redeem certificate, not found.';
    if (error === BaseContractErrors.certificateVesting) return 'Unable to redeem certificate, vesting period still active.';
    if (error === BaseContractErrors.transferToFailed) return 'Unable to redeem certificate, SRC transfer failed.';
  }

  return null;
}

function tryMatchOpdexError(input: string): string {
  const parts = input.split('OPDEX: ');

  if (parts.length !== 2) return null;

  // Index of the first space after our error
  const spaceIndex = parts[1].indexOf(' ');

  // Remove everything after our error
  return spaceIndex > 0
    ? parts[1].slice(0, spaceIndex - 1)
    : null;
}

function tryParseFriendlyOpdexErrorMessage(input: string, error: string): string {
  const parts = input.split(' at ');
  const { length } = parts;

  const method = length > 0
    ? parts[length - 1].trim()
    : null;

  return !!method
    ? evaluateOpdexError(method, error)
    : null;
}

function tryParseFriendlyOverflowMessage(input: string): string {
  return input.startsWith('OverflowException')
    ? 'Value overflow.'
    : null;
}
