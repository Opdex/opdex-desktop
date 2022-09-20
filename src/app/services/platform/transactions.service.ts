import { IAllowanceTransactionSummary, ICreatePoolTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { CoinGeckoApiService } from './../api/coin-gecko-api.service';
import { VaultService } from './vault.service';
import { MiningGovernanceService } from './mining-governance.service';
import { LiquidityPoolService } from './liquidity-pool.service';
import { TokenService } from './token.service';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { firstValueFrom } from 'rxjs';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { Injectable } from "@angular/core";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { TransactionQuote } from '@models/platform/transaction-quote';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { IApprovalLog, ICreateLiquidityPoolLog } from '@interfaces/contract-logs.interface';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { CsvData } from '@components/modals-module/export-wallet-history-modal/export-wallet-history-modal.component';

@Injectable({providedIn: 'root'})
export class TransactionsService {
  constructor(
    private _cirrus: CirrusApiService,
    private _tokenService: TokenService,
    private _liquidityPoolService: LiquidityPoolService,
    private _miningGovernanceService: MiningGovernanceService,
    private _vaultService: VaultService,
    private _coinGecko: CoinGeckoApiService
  ) { }

  async searchTransactionReceipts(request: ReceiptSearchRequest) {
    const txs = await firstValueFrom(this._cirrus.searchContractReceipts(request));
    return txs.map(tx => new TransactionReceipt(tx));
  }

  public async replayQuote(quote: TransactionQuote): Promise<TransactionQuote> {
    const response = await firstValueFrom(this._cirrus.localCall(quote.request));
    return new TransactionQuote(quote.request, response);
  }

  /////////////////////////////////////////
  // Transaction Feed Summaries
  /////////////////////////////////////////
  public async getAllowanceTransactionSummary(tx: TransactionReceipt): Promise<IAllowanceTransactionSummary> {
    let response: IAllowanceTransactionSummary = {};

    const approveEvents = tx.events.filter(event => (event.log.event as TransactionLogTypes) === TransactionLogTypes.ApprovalLog);

    if (approveEvents[0] === undefined) {
      response.error = 'Unable to read approve allowance transaction.';
      return response;
    }

    try {
      const log = <IApprovalLog>approveEvents[0].log.data;

      response.token = await this._tokenService.getToken(approveEvents[0].address);
      response.amount = FixedDecimal.FromBigInt(log.amount, response.token.decimals);
      response.to = log.spender;
    } catch {
      response.error = 'Unable to read approve allowance transaction.'
    }

    return response;
  }

  public async getCreatePoolTransactionSummary(tx: TransactionReceipt): Promise<ICreatePoolTransactionSummary> {
    let response: ICreatePoolTransactionSummary = { isQuote: !tx.hash};

    const createEvents = tx.events.filter(event => (event.log.event as TransactionLogTypes) === TransactionLogTypes.CreateLiquidityPoolLog);

    if (createEvents[0] === undefined) {
      response.error = 'Oops, something is wrong.';
      return response;
    }

    try {
      const log = <ICreateLiquidityPoolLog>createEvents[0].log.data;

      if (response.isQuote) {
        response.src = await this._tokenService.getToken(log.token);
        response.crs = await this._tokenService.getToken('CRS');
      } else {
        response.pool = await this._liquidityPoolService.getLiquidityPool(log.pool);
      }
    } catch {
      response.error = 'Oops, something is wrong.';
    }

    return response;
  }

  /////////////////////////////////////////
  // Wallet Export Summaries
  /////////////////////////////////////////
  public async getCsvSummary(tx: TransactionReceipt): Promise<CsvData> {
    if (tx.transactionType.title === 'Allowance') return await this.getAllowanceCsvSummary(tx);
    else if (tx.transactionType.title === 'Provide') return null;
    else if (tx.transactionType.title === 'Stake') return null;
    else if (tx.transactionType.title === 'Mine') return null;
    else if (tx.transactionType.title === 'Vault Certificate') return null;
    else if (tx.transactionType.title === 'Ownership') return null;
    else if (tx.transactionType.title === 'Swap') return null;
    else if (tx.transactionType.title === 'Create Pool') return this.getCreatePoolCsvSummary(tx);
    else if (tx.transactionType.title === 'Enable Mining') return null;
    else if (tx.transactionType.title === 'Distribute') return null;
    else if (tx.transactionType.title === 'Vault Proposal') return null;
    else if (tx.transactionType.title === 'Transfer') return null;
    // else if (tx.transactionSummary === 'Permissions') return null;
    else return null;
  }

  public async getAllowanceCsvSummary(tx: TransactionReceipt): Promise<CsvData> {
    // const summary = await this.getAllowanceTransactionSummary(tx);
    const crsPrice = await this._coinGecko.getHistoricalPrice(tx.block.time);
    // Todo: Get CRS cost at block time

    let data: CsvData = {
      transactionHash: tx.hash,
      transactionEventNumber: 0,
      blockNumber: tx.block.height,
      blockTime: this._getUtcDate(tx.block.time),
      account: 'Opdex',
      gasFeeCrs: tx.gasCost.formattedValue,
      gasFeeFiat: 0,
      transactionType: tx.transactionSummary,
      // Todo: Rip nulls
      amountSpent: null,
      tokenSpent: null,
      totalFiatSpent: null,
      amountReceived: null,
      tokenReceived: null,
      totalFiatReceived: null
    };

    return data;
  }

  public async getCreatePoolCsvSummary(tx: TransactionReceipt): Promise<CsvData> {
    // const summary = await this.getAllowanceTransactionSummary(tx);
    const crsPrice = await this._coinGecko.getHistoricalPrice(tx.block.time);
    // Todo: Get CRS cost at block time

    let data: CsvData = {
      transactionHash: tx.hash,
      transactionEventNumber: 0,
      blockNumber: tx.block.height,
      blockTime: this._getUtcDate(tx.block.time),
      account: 'Opdex',
      gasFeeCrs: tx.gasCost.formattedValue,
      gasFeeFiat: 0,
      transactionType: tx.transactionSummary,
      // Todo: Rip nulls
      amountSpent: null,
      tokenSpent: null,
      totalFiatSpent: null,
      amountReceived: null,
      tokenReceived: null,
      totalFiatReceived: null
    };

    return data;
  }


  /////////////////////////////////////////
  // Helpers
  /////////////////////////////////////////
  // Todo: Maybe use .toISOString and remove 'T' and milliseconds
  private _getUtcDate(time: Date): string {
    // Returned as YYYY-MM-DD HH:mm:ss Z
    const year = time.getUTCFullYear();
    const month = this._padTo2Digits(time.getUTCMonth());
    const day = this._padTo2Digits(time.getUTCDate());
    const hours = this._padTo2Digits(time.getUTCHours());
    const minutes = this._padTo2Digits(time.getUTCMinutes());
    const seconds = this._padTo2Digits(time.getUTCSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} Z`;
  }

  private _padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
  }
}
