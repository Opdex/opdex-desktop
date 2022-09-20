import { FixedDecimal } from '@models/types/fixed-decimal';
import { Token } from '@models/platform/token';
import { LiquidityPool } from '@models/platform/liquidity-pool';

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
