import { TransactionsService } from '@services/platform/transactions.service';
import { Injectable } from "@angular/core";
import { Token } from '@models/platform/token';
import { Currencies } from '@enums/currencies';
import { IPriceHistory } from '@interfaces/coin-gecko.interface';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { CsvData } from '@models/platform/wallet-export-csv-data';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TokenService } from './token.service';

@Injectable({providedIn: 'root'})
export class WalletExportService {
  constructor(
    private _transactionsService: TransactionsService,
    private _tokenService: TokenService,
  ) {}

  public async getCsvSummaries(txs: TransactionReceipt[], history: IPriceHistory[], currency: Currencies): Promise<CsvData[]> {
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

      const csv = await this._getCsvSummary(tx, crsPrice.price, currency);

      // concat is generally more performant than csvData.push(...csv);
      csvData = csvData.concat(csv);
    }

    return csvData;
  }

  private async _getCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    if (tx.transactionType?.title === 'Allowance') return this._getGeneralCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Provide') return await this._getProvidingCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Stake') return await this._getStakingCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Mine') return await this._getMiningCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Vault Certificate') return await this._getVaultCertificateCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Ownership') return this._getGeneralCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Swap') return await this._getSwapCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Create Pool') return this._getGeneralCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Enable Mining') return this._getGeneralCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Distribute') return this._getGeneralCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Vault Proposal') return await this._getVaultProposalCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Transfer') return await this._getTransferCsvSummary(tx, crsPrice, currency);
    else if (tx.transactionType?.title === 'Permissions') return this._getGeneralCsvSummary(tx, crsPrice, currency);
    else return this._getGeneralCsvSummary(tx, crsPrice, currency);
  }

  private _getGeneralCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): CsvData[] {
    return [{
      transactionHash: tx.hash,
      transactionEventNumber: 1,
      blockNumber: tx.block.height,
      blockTime: this._getUtcDate(tx.block.time),
      account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
      gasFeeCrs: tx.gasCost.formattedValue,
      gasFeeFiat: tx.gasCost.multiply(crsPrice).formattedValue,
      transactionType: tx.transactionSummary,
      currency: currency.toUpperCase()
    }];
  }

  private async _getTransferCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getTransferTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    data[0].amountSpent = summary.transferAmount.formattedValue;
    data[0].tokenSpent = summary.token.symbol;
    data[0].fiatSpent = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.token, summary.transferAmount);

    return data;
  }

  private async _getSwapCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getSwapTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    data[0].amountSpent = summary.tokenInAmount.formattedValue
    data[0].tokenSpent = summary.tokenIn.symbol;
    data[0].fiatSpent = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.tokenIn, summary.tokenInAmount);
    data[0].amountReceived = summary.tokenOutAmount.formattedValue
    data[0].tokenReceived = summary.tokenOut.symbol;
    data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.tokenOut, summary.tokenOutAmount);

    return data;
  }

  private async _getMiningCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getMineTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    // Started Mining
    if (summary.isAddition) {
      data[0].amountSpent = summary.lptAmount.formattedValue
      data[0].tokenSpent = summary.pool.lpToken.symbol;
      data[0].fiatSpent = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.lpToken, summary.lptAmount);
    }
    // Stopped || Collected
    else {
      if (!!summary.lptAmount && !summary.lptAmount.isZero) {
        data[0].transactionType = 'Stop Mining';
        data[0].amountReceived = summary.lptAmount.formattedValue;
        data[0].tokenReceived = summary.pool.lpToken.symbol;
        data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.lpToken, summary.lptAmount);
      } else if (!!summary.collectAmount && !summary.collectAmount.isZero) {
        data[0].transactionType = 'Collect Mining Rewards';
        data[0].amountReceived = summary.collectAmount.formattedValue;
        data[0].tokenReceived = summary.pool.stakingToken.symbol;
        data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.stakingToken, summary.collectAmount);
      }

      // Collected ODX
      if ((!!summary.lptAmount && !summary.lptAmount.isZero) && (!!summary.collectAmount && !summary.collectAmount.isZero)) {
        data.push({
          transactionHash: tx.hash,
          transactionEventNumber: 2,
          blockNumber: tx.block.height,
          blockTime: this._getUtcDate(tx.block.time),
          account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
          gasFeeCrs: '0',
          gasFeeFiat: '0',
          transactionType: 'Collect Mining Rewards',
          currency: currency.toUpperCase(),
          amountReceived: summary.collectAmount.formattedValue,
          tokenReceived: summary.pool.stakingToken.symbol,
          fiatReceived: await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.stakingToken, summary.collectAmount)
        })
      }
    }

    return data;
  }

  private async _getProvidingCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getProvideTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    if (summary.isAddition) {
      // Input CRS
      data[0].amountSpent = summary.crsAmount.formattedValue
      data[0].tokenSpent = summary.pool.crsToken.symbol;
      data[0].fiatSpent = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.crsToken, summary.crsAmount);
      // Output OLPT
      data[0].amountReceived = summary.lptAmount.formattedValue
      data[0].tokenReceived = summary.pool.lpToken.symbol;
      data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.lpToken, summary.lptAmount);
    } else {
      // Input OLPT
      data[0].amountSpent = summary.lptAmount.formattedValue
      data[0].tokenSpent = summary.pool.lpToken.symbol;
      data[0].fiatSpent = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.lpToken, summary.lptAmount);
      // Output CRS
      data[0].amountReceived = summary.crsAmount.formattedValue
      data[0].tokenReceived = summary.pool.crsToken.symbol;
      data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.crsToken, summary.crsAmount);
    }

    // summary.isAddition ? inputSRC : outputSrc
    data.push({
      transactionHash: tx.hash,
      transactionEventNumber: 2,
      blockNumber: tx.block.height,
      blockTime: this._getUtcDate(tx.block.time),
      account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
      gasFeeCrs: '0',
      gasFeeFiat: '0',
      transactionType: tx.transactionSummary,
      currency: currency.toUpperCase(),
      amountReceived: summary.isAddition ? null : summary.srcAmount.formattedValue,
      tokenReceived:  summary.isAddition ? null : summary.pool.srcToken.symbol,
      fiatReceived: summary.isAddition ? null : await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.srcToken, summary.srcAmount),
      amountSpent: summary.isAddition ? summary.srcAmount.formattedValue : null,
      tokenSpent: summary.isAddition ? summary.pool.srcToken.symbol : null,
      fiatSpent: summary.isAddition ? await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.srcToken, summary.srcAmount) : null
    });

    return data;
  }

  private async _getStakingCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getStakingTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    const startedStaking = summary.isAddition;
    const stoppedStaking = !startedStaking && !!summary.stakingAmount && !summary.stakingAmount.isZero;
    const onlyCollected = !stoppedStaking && summary.isCollection;

    // Started Staking
    if (startedStaking) {
      data[0].amountSpent = summary.stakingAmount.formattedValue
      data[0].tokenSpent = summary.pool.stakingToken.symbol;
      data[0].fiatSpent = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.stakingToken, summary.stakingAmount);
    } else if (stoppedStaking) {
      // Received ODX
      data[0].amountReceived = summary.stakingAmount.formattedValue
      data[0].tokenReceived = summary.pool.stakingToken.symbol;
      data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.pool.stakingToken, summary.stakingAmount);

      // Could have OLPT collected or CRS for amount one
      if (!!summary.collectAmountOne && !summary.collectAmountOne.isZero) {
        data.push({
          transactionHash: tx.hash,
          transactionEventNumber: 2,
          blockNumber: tx.block.height,
          blockTime: this._getUtcDate(tx.block.time),
          account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
          gasFeeCrs: '0',
          gasFeeFiat: '0',
          transactionType: 'Collect Staking Rewards',
          currency: currency.toUpperCase(),
          amountReceived: summary.collectAmountOne.formattedValue,
          tokenReceived:  summary.amountOneToken.symbol,
          fiatReceived: await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.amountOneToken, summary.collectAmountOne),
        });
      }

      // If amount two, would be liquidated rewards for SRC tokens
      if (!!summary.collectAmountTwo && !summary.collectAmountTwo.isZero) {
        data.push({
          transactionHash: tx.hash,
          transactionEventNumber: 3,
          blockNumber: tx.block.height,
          blockTime: this._getUtcDate(tx.block.time),
          account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
          gasFeeCrs: '0',
          gasFeeFiat: '0',
          transactionType: 'Collect Staking Rewards',
          currency: currency.toUpperCase(),
          amountReceived: summary.collectAmountTwo.formattedValue,
          tokenReceived:  summary.amountTwoToken.symbol,
          fiatReceived: await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.amountTwoToken, summary.collectAmountTwo),
        });
      }
    } else if (onlyCollected) {
      // Only collecting, would be OLPT or CRS
      if (!!summary.collectAmountOne && !summary.collectAmountOne.isZero) {
        data[0].transactionType = 'Collect Staking Rewards';
        data[0].amountReceived = summary.collectAmountOne.formattedValue;
        data[0].tokenReceived =  summary.amountOneToken.symbol;
        data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.amountOneToken, summary.collectAmountOne);
      }

      // If amount two, would be liquidated rewards for SRC tokens
      if (!!summary.collectAmountTwo && !summary.collectAmountTwo.isZero) {
        data.push({
          transactionHash: tx.hash,
          transactionEventNumber: 2,
          blockNumber: tx.block.height,
          blockTime: this._getUtcDate(tx.block.time),
          account: !!tx.transactionType ? 'Opdex' : 'Cirrus',
          gasFeeCrs: '0',
          gasFeeFiat: '0',
          transactionType: 'Collect Staking Rewards',
          currency: currency.toUpperCase(),
          amountReceived: summary.collectAmountTwo.formattedValue,
          tokenReceived:  summary.amountTwoToken.symbol,
          fiatReceived: await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.amountTwoToken, summary.collectAmountTwo),
        });
      }
    }

    return data;
  }

  private async _getVaultCertificateCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getVaultCertificateTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    data[0].amountReceived = summary.amount.formattedValue;
    data[0].tokenReceived = summary.vaultToken.symbol;
    data[0].fiatReceived = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.vaultToken, summary.amount);

    return data;
  }

  private async _getVaultProposalCsvSummary(tx: TransactionReceipt, crsPrice: FixedDecimal, currency: Currencies): Promise<CsvData[]> {
    const summary = await this._transactionsService.getVaultProposalTransactionSummary(tx);
    const data = this._getGeneralCsvSummary(tx, crsPrice, currency);

    if (!!summary.error) return data;

    // Pledged, voted or withdrew
    if (!!summary.pledgeOrVote) {
      const value = summary.pledgeOrVote.amount.formattedValue;
      const token = summary.crs.symbol;
      const fiat = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.crs, summary.pledgeOrVote.amount);

      if (summary.pledgeOrVote.withdrawal) {
        data[0].amountReceived = value;
        data[0].tokenReceived = token
        data[0].fiatReceived =  fiat;
      } else {
        data[0].amountSpent = value;
        data[0].tokenSpent = token
        data[0].fiatSpent =  fiat;
      }
    }
    // Created or completed proposal
    else {
      // Creating requires a fixed 500 CRS temp deposit, completing returns deposit
      const deposit = new FixedDecimal('500', 8);
      const depositFiat = await this._getHistoricalTokenPrice(tx.block.height, crsPrice, summary.crs, deposit);

      // Completed proposal
      if (summary.createOrComplete.approved !== null) {
        // If the proposal creator is the person who completed, return deposit
        if (summary.proposal.creator === tx.from) {
          data[0].amountReceived = deposit.formattedValue;
          data[0].tokenReceived = summary.crs.symbol;
          data[0].fiatReceived = depositFiat
        }
      }
      // Created proposal
      else {
        data[0].amountSpent = deposit.formattedValue;
        data[0].tokenSpent = summary.crs.symbol;
        data[0].fiatSpent = depositFiat
      }
    }

    return data;
  }

  /////////////////////////////////////////
  // Helpers
  /////////////////////////////////////////
  private async _getHistoricalTokenPrice(block: number, crsPrice: FixedDecimal, token: Token, amount: FixedDecimal): Promise<string> {
    const srcPrice = await this._tokenService.getHistoricalTokenPricing(block, crsPrice, token);
    const total = srcPrice.multiply(amount);
    return total.formattedValue;
  }

  private _getUtcDate(date: Date): string {
    // Returned as YYYY-MM-DD HH:mm:ss Z
    return date.toISOString().replace('T', ' ').split('.')[0] + ' Z';
  }
}
