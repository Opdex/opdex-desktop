import { IAllowanceTransactionSummary, ICreatePoolTransactionSummary, IDistributeTransactionSummary, IMineTransactionSummary, IProvideTransactionSummary } from '@interfaces/transaction-summaries.interface';
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
import { IApprovalLog, IBurnLog, ICollectMiningRewardsLog, ICreateLiquidityPoolLog, IDistributionLog, IMintLog, IStartMiningLog, IStopMiningLog } from '@interfaces/contract-logs.interface';
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

  public async getDistributionTransactionSummary(tx: TransactionReceipt): Promise<IDistributeTransactionSummary> {
    let response: IDistributeTransactionSummary = {}
    ;
    try {
      const events = tx.events.filter(event => (event.log.event as TransactionLogTypes) === TransactionLogTypes.DistributionLog);

      if (events.length !== 1) {
        response.error = 'Unable to read distribution transaction.';
        return response;
      }

      const event = events[0];
      const token = await this._tokenService.getToken(event.address);
      const log = <IDistributionLog>event.log.data;

      response.token = token;
      response.miningGovernanceAmount = FixedDecimal.FromBigInt(log.miningAmount, response.token.decimals);
      response.vaultAmount = FixedDecimal.FromBigInt(log.vaultAmount, response.token.decimals);
    } catch {
      response.error = 'Oops, something went wrong.';
    }

    return response;
  }

  public async getProvideTransactionSummary(tx: TransactionReceipt): Promise<IProvideTransactionSummary> {
    let response: IProvideTransactionSummary = {};
    const eventTypes = [
      TransactionLogTypes.MintLog,
      TransactionLogTypes.BurnLog
    ]

    try {
      // Should only be one
      const provideEvents = tx.events
        .filter(event => eventTypes.includes(event.log.event as TransactionLogTypes));

      if (provideEvents.length > 1 || provideEvents.length === 0) {
        response.error = 'Unable to read provide transaction.';
        return response;
      }

      response.pool = await this._liquidityPoolService.getLiquidityPool(provideEvents[0].address);

      if (provideEvents[0].log.event === TransactionLogTypes.MintLog) {
        const event = provideEvents[0].log.data as IMintLog;
        response.isAddition = true;
        response.lptAmount = FixedDecimal.FromBigInt(event.amountLpt, response.pool.lpToken.decimals);
        response.srcAmount = FixedDecimal.FromBigInt(event.amountSrc, response.pool.srcToken.decimals);
        response.crsAmount = FixedDecimal.FromBigInt(event.amountCrs, response.pool.crsToken.decimals);
      } else {
        const event = provideEvents[0].log.data as IBurnLog;
        response.isAddition = false;
        response.lptAmount = FixedDecimal.FromBigInt(event.amountLpt, response.pool.lpToken.decimals);
        response.srcAmount = FixedDecimal.FromBigInt(event.amountSrc, response.pool.srcToken.decimals);
        response.crsAmount = FixedDecimal.FromBigInt(event.amountCrs, response.pool.crsToken.decimals);
      }
    } catch {
      response.error = 'Oops, something went wrong.';
    }

    return response;
  }

  public async getMineTransactionSummary(tx: TransactionReceipt): Promise<IMineTransactionSummary> {
    let response: IMineTransactionSummary = {};
    const eventTypes = [
      TransactionLogTypes.StartMiningLog,
      TransactionLogTypes.StopMiningLog,
      TransactionLogTypes.CollectMiningRewardsLog
    ]

    const mineEvents = tx.events.filter(event => eventTypes.includes(event.log.event as TransactionLogTypes));

    var collectEvent = mineEvents.find(event => event.log.event === TransactionLogTypes.CollectMiningRewardsLog);
    var startEvent = mineEvents.find(event => event.log.event === TransactionLogTypes.StartMiningLog);
    var stopEvent = mineEvents.find(event => event.log.event === TransactionLogTypes.StopMiningLog);

    if (mineEvents.length > 2 || mineEvents.length === 0 || (!collectEvent && !startEvent && !stopEvent)) {
      response.error = 'Unable to read mine transaction.';
      return response;
    }

    try {
      response.pool = await this._liquidityPoolService.getLiquidityPoolByMiningPoolAddress(startEvent?.address || stopEvent?.address || collectEvent?.address)

      const collectAmount = collectEvent === undefined ? BigInt('0') : (<ICollectMiningRewardsLog>collectEvent.log.data).amount;
      response.collectAmount = FixedDecimal.FromBigInt(collectAmount, response.pool.stakingToken?.decimals);

      let lptAmount = FixedDecimal.Zero(response.pool.lpToken.decimals);

      if (startEvent !== undefined) {
        response.isAddition = true;
        lptAmount = FixedDecimal.FromBigInt((<IStartMiningLog>startEvent.log.data).amount, response.pool.lpToken.decimals);
      }
      else if (stopEvent !== undefined) {
        response.isAddition = false;
        lptAmount = FixedDecimal.FromBigInt((<IStopMiningLog>stopEvent.log.data).amount, response.pool.lpToken.decimals);
      }

      response.lptAmount = lptAmount;
    } catch {
      response.error = 'Oops, something went wrong';
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
