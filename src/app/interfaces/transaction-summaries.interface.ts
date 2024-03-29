import { FixedDecimal } from '@models/types/fixed-decimal';
import { Token } from '@models/platform/token';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Vault } from '@models/platform/vault';
import { VaultProposal } from '@models/platform/vault-proposal';

export interface IAllowanceTransactionSummary {
  token?: Token;
  amount?: FixedDecimal;
  to?: string;
  error?: string;
}

export interface ICreatePoolTransactionSummary {
  pool?: LiquidityPool;
  crs?: Token;
  src?: Token;
  error?: string;
  isQuote: boolean;
}

export interface IDistributeTransactionSummary {
  miningGovernanceAmount?: FixedDecimal;
  vaultAmount?: FixedDecimal;
  token?: Token;
  error?: string;
}

export interface IEnableMiningTransactionSummary {
  poolAmount?: FixedDecimal;
  pools?: LiquidityPool[];
  stakingToken?: Token;
  error?: string;
}

export interface IMineTransactionSummary {
  isAddition?: boolean;
  lptAmount?: FixedDecimal;
  collectAmount?: FixedDecimal;
  pool?: LiquidityPool;
  error?: string;
}

export interface IProvideTransactionSummary {
  isAddition?: boolean;
  lptAmount?: FixedDecimal;
  crsAmount?: FixedDecimal;
  srcAmount?: FixedDecimal;
  pool?: LiquidityPool;
  error?: string;
}

export interface IStakeTransactionSummary {
  isAddition?: boolean;
  isCollection?: boolean;
  collectionLiquidatedRewards?: boolean;
  stakingAmount?: FixedDecimal;
  amountOneToken?: Token;
  amountTwoToken?: Token;
  collectAmountOne?: FixedDecimal; // Could be OLPT, or if liquidated, CRS
  collectAmountTwo?: FixedDecimal; // If liquidated, SRC
  pool?: LiquidityPool;
  error?: string;
}

export interface ISwapTransactionSummary {
  tokenIn?: Token;
  tokenOut?: Token;
  tokenInAmount?: FixedDecimal;
  tokenOutAmount?: FixedDecimal;
  error?: string;
}

export interface ITransferTransactionSummary {
  transferAmount?: FixedDecimal;
  token?: Token;
  error?: string;
}

export interface IVaultCertificateTransactionSummary {
  vaultToken?: Token;
  amount?: FixedDecimal;
  error?: string;
}

export interface IVaultProposalTransactionSummary {
  vault?: Vault,
  proposal?: VaultProposal;
  pledgeOrVote?: IVaultProposalPledgeOrVoteSummary;
  createOrComplete?: IVaultProposalCreateOrCompleteSummary;
  crs?: Token;
  vaultToken?: Token;
  proposalId?: number;
  error?: string;
}

export interface IVaultProposalPledgeOrVoteSummary {
  amount: FixedDecimal;
  withdrawal: boolean;
  inFavor?: boolean;
}

export interface IVaultProposalCreateOrCompleteSummary {
  type?: string;
  approved?: boolean;
  amount?: FixedDecimal;
}
