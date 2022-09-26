import { IReceiptLogs } from '@interfaces/full-node.interface';
import { EnvironmentsService } from '@services/utility/environments.service';
import { CoinGeckoApiService } from '@services/api/coin-gecko-api.service';
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
import { FixedDecimal } from '@models/types/fixed-decimal';
import { CsvData } from '@components/modals-module/export-wallet-history-modal/export-wallet-history-modal.component';
import { ProposalType } from '@models/platform/vault-proposal';
import { IEnableMiningTransactionSummary, IStakeTransactionSummary, ISwapTransactionSummary, ITransferTransactionSummary,
  IVaultCertificateTransactionSummary, IVaultProposalPledgeOrVoteSummary, IVaultProposalTransactionSummary, IAllowanceTransactionSummary,
  ICreatePoolTransactionSummary, IDistributeTransactionSummary, IMineTransactionSummary, IProvideTransactionSummary } from '@interfaces/transaction-summaries.interface';
import { IApprovalLog, IBurnLog, ICollectMiningRewardsLog, ICollectStakingRewardsLog, ICompleteVaultProposalLog, ICreateLiquidityPoolLog, ICreateVaultProposalLog,
  IDistributionLog, IMintLog, IRedeemVaultCertificateLog, IRewardMiningPoolLog, IStartMiningLog, IStartStakingLog, IStopMiningLog, IStopStakingLog, ISwapLog,
  ITransferLog, IVaultProposalPledgeLog, IVaultProposalVoteLog, IVaultProposalWithdrawPledgeLog, IVaultProposalWithdrawVoteLog } from '@interfaces/contract-logs.interface';
import { IPriceHistory } from '@interfaces/coin-gecko.interface';

@Injectable({providedIn: 'root'})
export class TransactionsService {
  constructor(
    private _cirrus: CirrusApiService,
    private _tokenService: TokenService,
    private _liquidityPoolService: LiquidityPoolService,
    private _miningGovernanceService: MiningGovernanceService,
    private _vaultService: VaultService,
    private _coinGecko: CoinGeckoApiService,
    private _envService: EnvironmentsService
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

    const approveEvents = tx.events.filter(event => event.log.event === TransactionLogTypes.ApprovalLog);

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

    const createEvents = tx.events.filter(event => event.log.event === TransactionLogTypes.CreateLiquidityPoolLog);

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
    let response: IDistributeTransactionSummary = {};

    try {
      const events = tx.events.filter(event => event.log.event === TransactionLogTypes.DistributionLog);

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

  public async getEnableMiningTransactionSummary(tx: TransactionReceipt): Promise<IEnableMiningTransactionSummary> {
    let response: IEnableMiningTransactionSummary = {};

    try {
      const rewardEvents = tx.events.filter(event => event.log.event === TransactionLogTypes.RewardMiningPoolLog);

      if (rewardEvents.length > 4 || rewardEvents.length === 0) {
        response.error = 'Unable to read enable mining transaction.';
        return response;
      }

      let logs: IRewardMiningPoolLog[] = [];
      const pools = await Promise.all(rewardEvents.map(event => {
        const log = <IRewardMiningPoolLog>event.log.data;
        logs.push(log);
        return this._liquidityPoolService.getLiquidityPool(log.stakingPool);
      }))

      response.pools = pools;
      response.poolAmount = FixedDecimal.FromBigInt(logs[0].amount, pools[0].stakingToken?.decimals);
      response.stakingToken = pools[0].stakingToken;
    } catch {
      response.error = 'Oops, something went wrong.';
    }

    return response;
  }

  public async getStakingTransactionSummary(tx: TransactionReceipt): Promise<IStakeTransactionSummary> {
    let response: IStakeTransactionSummary = {};
    const eventTypes = [
      TransactionLogTypes.StartStakingLog,
      TransactionLogTypes.StopStakingLog,
      TransactionLogTypes.CollectStakingRewardsLog,
      TransactionLogTypes.BurnLog
    ];

    try {
      const stakeEvents = tx.events.filter(event => eventTypes.includes(event.log.event as TransactionLogTypes));

      var startEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.StartStakingLog);
      var stopEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.StopStakingLog);
      var collectEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.CollectStakingRewardsLog);
      var burnEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.BurnLog);

      if (stakeEvents.length > 4 || stakeEvents.length === 0 || (!collectEvent && !startEvent && !stopEvent)) {
        response.error = 'Unable to read stake transaction.';
        return response;
      }

      response.isAddition = startEvent !== undefined;
      response.isCollection = collectEvent !== undefined;
      response.collectionLiquidatedRewards = response.isCollection && burnEvent !== undefined;
      response.pool = await this._liquidityPoolService.getLiquidityPool(startEvent?.address || stopEvent?.address || collectEvent?.address);

      let stakingAmount: BigInt;

      if (!!startEvent) stakingAmount = (<IStartStakingLog>startEvent.log.data).amount;
      else if (!!stopEvent) stakingAmount = (<IStopStakingLog>stopEvent.log.data).amount;
      else stakingAmount = BigInt('0');

      response.stakingAmount = FixedDecimal.FromBigInt(stakingAmount, response.pool.stakingToken?.decimals);

      if (response.isCollection) {
        if (response.collectionLiquidatedRewards) {
          response.amountOneToken = response.pool.crsToken;
          response.amountTwoToken = response.pool.srcToken;

          const burnLog = <IBurnLog>burnEvent.log.data;
          const amountOne = burnLog.amountCrs;
          const amountTwo = burnLog.amountSrc;

          response.collectAmountOne = FixedDecimal.FromBigInt(amountOne, response.amountOneToken.decimals);
          response.collectAmountTwo = FixedDecimal.FromBigInt(amountTwo, response.amountTwoToken.decimals);
        } else {
          const collectionLog = <ICollectStakingRewardsLog>collectEvent.log.data;

          response.amountOneToken = response.pool.lpToken;
          response.collectAmountOne = FixedDecimal.FromBigInt(collectionLog.amount, response.amountOneToken.decimals);
        }
      }
    } catch {
      response.error = 'Oops, something went wrong.'
    }

    return response;
  }

  public async getTransferTransactionSummary(tx: TransactionReceipt): Promise<ITransferTransactionSummary> {
    let response: ITransferTransactionSummary = {};

    try {
      const events = tx.events.filter(event => event.log.event === TransactionLogTypes.TransferLog);

      if (events.length !== 1 || tx.events.length !== 1) {
        response.error = 'Unable to read non-standard token transfer.';
        return response;
      }

      const event = events[0];
      const log = <ITransferLog>event.log.data;

      if (!log.amount) {
        response.error = 'Unknown token transfer type.';
        return response;
      }

      const token = await this._tokenService.getToken(event.address);

      response.token = token;
      response.transferAmount = FixedDecimal.FromBigInt(log.amount, token.decimals);
    } catch {
      response.error = 'Oops, something went wrong.';
    }

    return response;
  }

  public async getVaultCertificateTransactionSummary(tx: TransactionReceipt): Promise<IVaultCertificateTransactionSummary> {
    let response: IVaultCertificateTransactionSummary = {};

    try {
      const event = tx.events.find(event => event.log.data === TransactionLogTypes.RedeemVaultCertificateLog);
      const log = <IRedeemVaultCertificateLog>event.log.data;

      if (!event) {
        response.error = 'Unable to read redeem certificate transaction.';
        return response;
      }

      response.vaultToken = await this._tokenService.getToken(this._envService.contracts.odx);
      response.amount = FixedDecimal.FromBigInt(log.amount, response.vaultToken.decimals);
    } catch {
      response.error = 'Oops, something went wrong.';
    }

    return response;
  }

  public async getSwapTransactionSummary(tx: TransactionReceipt): Promise<ISwapTransactionSummary> {
    let response: ISwapTransactionSummary = {};

    try {
      const swapEvents = tx.events.filter(event => event.log.event === TransactionLogTypes.SwapLog);

      if (swapEvents.length == 0 || swapEvents.length > 2) {
        response.error = 'Unable to read swap transaction.'
        return response;
      }

      if (swapEvents.length === 1) {
        const event = swapEvents[0];
        const log = <ISwapLog>swapEvents[0].log.data;
        const pool = await this._liquidityPoolService.getLiquidityPool(event.address);

        if (!pool) {
          response.error = 'Unrecognized liquidity pool.';
          return response;
        }

        const crsIn = FixedDecimal.FromBigInt(log.amountCrsIn, 8);

        response.tokenIn = crsIn.isZero ? pool.srcToken : pool.crsToken;
        response.tokenOut = crsIn.isZero ? pool.crsToken : pool.srcToken;

        const tokenInAmount = crsIn.isZero ? log.amountSrcIn : log.amountCrsIn;
        response.tokenInAmount = FixedDecimal.FromBigInt(tokenInAmount, response.tokenIn.decimals);

        const tokenOutAmount = crsIn.isZero ? log.amountCrsOut : log.amountSrcOut;
        response.tokenOutAmount = FixedDecimal.FromBigInt(tokenOutAmount, response.tokenOut.decimals);
      }
      else if (swapEvents.length === 2) {
        const firstEvent = swapEvents[0];
        const firstLog = <ISwapLog>swapEvents[0].log.data;
        const secondEvent = swapEvents[1];
        const secondLog = <ISwapLog>swapEvents[1].log.data;
        const firstPool = await this._liquidityPoolService.getLiquidityPool(firstEvent.address);
        const secondPool = await this._liquidityPoolService.getLiquidityPool(secondEvent.address);

        if (!firstPool || !secondPool) {
          response.error = 'Unrecognized liquidity pools.';
          return response;
        }

        response.tokenIn = firstPool.srcToken;
        response.tokenOut = secondPool.srcToken;
        response.tokenInAmount = FixedDecimal.FromBigInt(firstLog.amountSrcIn, response.tokenIn.decimals);
        response.tokenOutAmount = FixedDecimal.FromBigInt(secondLog.amountSrcOut, response.tokenOut.decimals);
      }
    } catch {
      response.error = 'Oops, something went wrong.'
    }

    return response;
  }

  public async getVaultProposalTransactionSummary(tx: TransactionReceipt): Promise<IVaultProposalTransactionSummary> {
    let response: IVaultProposalTransactionSummary = {};
    let createOrCompleteEvents: IReceiptLogs[];
    let pledgeOrVoteEvents: IReceiptLogs[];

    const pledgeOrVoteEventTypes = [
      TransactionLogTypes.VaultProposalPledgeLog,
      TransactionLogTypes.VaultProposalWithdrawPledgeLog,
      TransactionLogTypes.VaultProposalVoteLog,
      TransactionLogTypes.VaultProposalWithdrawVoteLog
    ];

    const createOrCompleteEventTypes = [
      TransactionLogTypes.CreateVaultProposalLog,
      TransactionLogTypes.CompleteVaultProposalLog,
    ];

    try {
      createOrCompleteEvents = tx.events.filter(event => createOrCompleteEventTypes.includes(event.log.event as TransactionLogTypes));
      pledgeOrVoteEvents = tx.events.filter(event => pledgeOrVoteEventTypes.includes(event.log.event as TransactionLogTypes));

      if (createOrCompleteEvents.length > 1 ||
          pledgeOrVoteEvents.length > 1 ||
          (createOrCompleteEvents.length === 0 && pledgeOrVoteEvents.length === 0)) {
        response.error = 'Unable to read vault proposal transaction.';
        return response;
      }

      response.proposalId = createOrCompleteEvents.length > 0
        ? createOrCompleteEvents[0].log.data.proposalId
        : pledgeOrVoteEvents[0].log.data.proposalId

      response.proposal = await this._vaultService.getProposal(response.proposalId);

      response = await this._buildPledgeOrVoteSummary(response, pledgeOrVoteEvents);
      response = await this._buildCreateOrCompleteSummary(response, createOrCompleteEvents);
    } catch {
      response.error = 'Oops, something went wrong.';
    }

    return response;
  }

  private async _buildPledgeOrVoteSummary(summary: IVaultProposalTransactionSummary, pledgeOrVoteEvents: IReceiptLogs[]): Promise<IVaultProposalTransactionSummary> {
    if (pledgeOrVoteEvents.length > 0) {
      const pledgeEvent = pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalPledgeLog);
      const pledgeLog = pledgeEvent ? <IVaultProposalPledgeLog>pledgeEvent.log.data : undefined;

      const withdrawPledgeEvent = pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalWithdrawPledgeLog);
      const withdrawPledgeLog = withdrawPledgeEvent ? <IVaultProposalWithdrawPledgeLog>withdrawPledgeEvent.log.data : undefined;

      const voteEvent = pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalVoteLog);
      const voteLog = voteEvent ? <IVaultProposalVoteLog>voteEvent.log.data : undefined;

      const withdrawVoteEvent = pledgeOrVoteEvents.find(event => event.log.event === TransactionLogTypes.VaultProposalWithdrawVoteLog);
      const withdrawVoteLog = withdrawVoteEvent ? <IVaultProposalWithdrawVoteLog>withdrawVoteEvent.log.data : undefined;

      const crs = await this._tokenService.getToken('CRS')
      summary.crs = crs;
      summary.pledgeOrVote = { inFavor: null } as IVaultProposalPledgeOrVoteSummary;

      if (pledgeLog || voteLog) {
        summary.pledgeOrVote.inFavor = pledgeLog ? null : voteLog.inFavor;
        summary.pledgeOrVote.amount = pledgeLog
          ? FixedDecimal.FromBigInt(pledgeLog.pledgeAmount, crs.decimals)
          : FixedDecimal.FromBigInt(voteLog.voteAmount, crs.decimals);
      }
      else if (withdrawPledgeLog || withdrawVoteLog) {
        summary.pledgeOrVote.withdrawal = true;
        summary.pledgeOrVote.amount = withdrawPledgeLog
          ? FixedDecimal.FromBigInt(withdrawPledgeLog.withdrawAmount, crs.decimals)
          : FixedDecimal.FromBigInt(withdrawVoteLog.withdrawAmount, crs.decimals);
      }
    }

    return summary;
  }

  private async _buildCreateOrCompleteSummary(summary: IVaultProposalTransactionSummary, createOrCompleteEvents: IReceiptLogs[]): Promise<IVaultProposalTransactionSummary> {
    if (createOrCompleteEvents.length > 0) {
      const createEvent = createOrCompleteEvents.find(event => event.log.event === TransactionLogTypes.CreateVaultProposalLog);
      const completeEvent = createOrCompleteEvents.find(event => event.log.event === TransactionLogTypes.CompleteVaultProposalLog);
      const createLog = createEvent ? <ICreateVaultProposalLog>createEvent.log.data : undefined;
      const completeLog = completeEvent ? <ICompleteVaultProposalLog>completeEvent.log.data : undefined;

      const vault = await this._vaultService.getVault();
      const token = await this._tokenService.getToken(vault.token);

      summary.vault = vault
      summary.vaultToken = token;
      summary.createOrComplete = { approved: null };

      if (summary.proposal?.type === 'Create' || createLog?.type === ProposalType.Create) summary.createOrComplete.type = 'New Certificate';
      else if (summary.proposal?.type === 'Revoke' || createLog?.type === ProposalType.Revoke) summary.createOrComplete.type = 'Revoke Certificate';
      else if (summary.proposal?.type === 'TotalPledgeMinimum' || createLog?.type === ProposalType.TotalPledgeMinimum) summary.createOrComplete.type = 'Pledge Change';
      else if (summary.proposal?.type === 'TotalVoteMinimum' || createLog?.type === ProposalType.TotalVoteMinimum) summary.createOrComplete.type = 'Vote Change';

      if (completeLog) summary.createOrComplete.approved = completeLog.approved;
    }

    return summary;
  }

  /////////////////////////////////////////
  // Wallet Export Summaries
  /////////////////////////////////////////
  public async getCsvSummaries(txs: TransactionReceipt[], history: IPriceHistory[]): Promise<CsvData[]> {
    let csvData: CsvData[] = [];

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];

      const crsPrice = history.find(history => {
        const priceDate = new Date(history.date);
        const txDate = new Date(tx.block.time);
        priceDate.setHours(0,0,0,0);
        txDate.setHours(0,0,0,0);
        return priceDate.getTime() === txDate.getTime();
      });

      const csv = await this._getCsvSummary(tx, crsPrice.price);

      // concat is generally more performant than csvData.push(...csv);
      csvData = csvData.concat(csv);
    }

    return csvData;
  }

  private async _getCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal): Promise<CsvData[]> {
    if (tx.transactionType?.title === 'Allowance') return this._getGeneralCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Provide') return [];
    else if (tx.transactionType?.title === 'Stake') return [];
    else if (tx.transactionType?.title === 'Mine') return [];
    else if (tx.transactionType?.title === 'Vault Certificate') return [];
    else if (tx.transactionType?.title === 'Ownership') return this._getGeneralCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Swap') return await this._getSwapCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Create Pool') return this._getGeneralCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Enable Mining') return this._getGeneralCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Distribute') return this._getGeneralCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Vault Proposal') return [];
    else if (tx.transactionType?.title === 'Transfer') return await this._getTransferCsvSummary(tx, crsPrice);
    else if (tx.transactionType?.title === 'Permissions') return this._getGeneralCsvSummary(tx, crsPrice);
    else return this._getGeneralCsvSummary(tx, crsPrice);
  }

  private _getGeneralCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal): CsvData[] {
    return [{
      transactionHash: tx.hash,
      transactionEventNumber: 0,
      blockNumber: tx.block.height,
      blockTime: this._getUtcDate(tx.block.time),
      account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
      gasFeeCrs: tx.gasCost.formattedValue,
      gasFeeFiat: tx.gasCost.multiply(crsPrice).formattedValue,
      transactionType: tx.transactionSummary
    }];
  }

  private async _getTransferCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal): Promise<CsvData[]> {
    const summary = await this.getTransferTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice);

    if (!summary.error) {
      data[0].amountSpent = summary.transferAmount.formattedValue;
      data[0].tokenSpent = summary.token.symbol;
      // Todo: Get token fiat amount
      data[0].totalFiatSpent = '0';
    }

    return data;
  }

  private async _getSwapCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal): Promise<CsvData[]> {
    const summary = await this.getSwapTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice);

    if (!summary.error) {
      data[0].amountSpent = summary.tokenInAmount.formattedValue
      data[0].tokenSpent = summary.tokenIn.symbol;
      // Todo: Get spent fiat amount
      data[0].totalFiatSpent = '0';
      data[0].amountReceived = summary.tokenOutAmount.formattedValue
      data[0].tokenReceived = summary.tokenOut.symbol;
      // Todo: Get received fiat amount
      data[0].totalFiatReceived = '0';
    }

    return data;
  }

  // public async getAllowanceCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal): Promise<CsvData[]> {
  //   const data = this.getGeneralCsvSummary(tx, crsPrice);

  //   let data: CsvData = {
  //     transactionHash: tx.hash,
  //     transactionEventNumber: 0,
  //     blockNumber: tx.block.height,
  //     blockTime: this._getUtcDate(tx.block.time),
  //     account: 'Opdex',
  //     gasFeeCrs: tx.gasCost.formattedValue,
  //     gasFeeFiat: tx.gasCost.multiply(crsPrice).formattedValue,
  //     transactionType: tx.transactionSummary,
  //     // Todo: Rip nulls
  //     amountSpent: null,
  //     tokenSpent: null,
  //     totalFiatSpent: null,
  //     amountReceived: null,
  //     tokenReceived: null,
  //     totalFiatReceived: null
  //   };

  //   return [data];
  // }

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
