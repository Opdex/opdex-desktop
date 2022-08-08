
import { WalletService } from '@services/platform/wallet.service';
import { Injector } from '@angular/core';
import { ReviewQuoteComponent } from './shared/review-quote/review-quote.component';
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { UserContextService } from "@services/utility/user-context.service";
import { Subscription } from 'rxjs';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { AllowanceValidation } from '@models/allowance-validation';
import { UserContext } from '@models/user-context';
import { NodeService } from '@services/platform/node.service';
import { ITransactionQuote } from '@interfaces/transaction-quote.interface';
import { Token } from '@models/platform/token';
import { LiquidityPool } from '@models/platform/liquidity-pool';

export abstract class TxBase {
  context: UserContext;
  context$: Subscription;
  quoteErrors: string[] = [];

  private _userContext: UserContextService;
  private _bottomSheet: MatBottomSheet;
  private _walletService: WalletService;
  protected _nodeService: NodeService;

  constructor(
    protected _injector: Injector
  ) {
    this._userContext = this._injector.get(UserContextService);
    this._bottomSheet = this._injector.get(MatBottomSheet);
    this._walletService = this._injector.get(WalletService);
    this._nodeService = this._injector.get(NodeService);
    this.context$ = this._userContext.context$.subscribe(context => this.context = context);
  }

  quote(quote: ITransactionQuote): void {
    this.quoteErrors = [];
    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  protected async _validateAllowance(owner: string, spender: string, token: Token, amount: string): Promise<AllowanceValidation> {
    if (!owner || !spender || !token || !amount) return null;

    const amountToSpend = new FixedDecimal(amount, token.decimals);

    const allowance = await this._walletService.getAllowance(owner, spender, token.address);
    return new AllowanceValidation(owner, spender, allowance, amountToSpend.formattedValue, token);
  }

  protected async _validateBalance(token: Token, amountToSpend: FixedDecimal): Promise<boolean> {
    if (!token) return false;
    if (amountToSpend.bigInt === BigInt(0)) return true;

    const balance = await this._walletService.getBalance(token.address, this.context.wallet);
    return this._isEnough(FixedDecimal.FromBigInt(balance, token.decimals), amountToSpend);
  }

  protected async _validateStakingBalance(liquidityPool: LiquidityPool, amountToSpend: FixedDecimal): Promise<boolean> {
    if (!liquidityPool) return false;
    if (amountToSpend.bigInt === BigInt(0)) return true;

    const balance = await this._walletService.getStakingPosition(liquidityPool.address, this.context.wallet);
    return this._isEnough(FixedDecimal.FromBigInt(balance, liquidityPool.stakingToken.decimals), amountToSpend);
  }

  protected async _validateMiningBalance(liquidityPool: LiquidityPool, amountToSpend: FixedDecimal): Promise<boolean> {
    if (!liquidityPool) return false;
    if (amountToSpend.bigInt === BigInt(0)) return true;

    const balance = await this._walletService.getMiningPosition(liquidityPool.miningPool.address, this.context.wallet);
    return this._isEnough(FixedDecimal.FromBigInt(balance, liquidityPool.lpToken.decimals), amountToSpend);
  }

  protected async _validateVaultPledge(proposalId: number, amountToSpend: FixedDecimal): Promise<boolean> {
    if (proposalId === 0) return false;
    if (amountToSpend.bigInt === BigInt(0)) return true;

    const pledge = await this._walletService.getVaultPledgePosition(proposalId, this.context.wallet)
    return this._isEnough(FixedDecimal.FromBigInt(pledge, 8), amountToSpend);
  }

  protected async _validateVaultVote(proposalId: number, amountToSpend: FixedDecimal): Promise<boolean> {
    if (proposalId === 0) return false;
    if (amountToSpend.bigInt === BigInt(0)) return true;

    const vote = await this._walletService.getVaultVotePosition(proposalId, this.context.wallet);
    return this._isEnough(FixedDecimal.FromBigInt(vote.balance, 8), amountToSpend);
  }

  private _isEnough(actualAmount: FixedDecimal, neededAmount: FixedDecimal) {
    // If the necessary amount is 0 but this is still being called, we're checking to make sure they have a balance in general
    if (neededAmount.bigInt === BigInt(0)) {
      return !actualAmount.isZero;
    }

    return actualAmount.bigInt >= neededAmount.bigInt;
  }

  /**
   * Force the implementation of unsubscribing from the context$ stream.
   * In good faith, hoping, developers implement the method correctly, and execute it
   * during OnDestroy
   */
  abstract destroyContext$(): void;
}
