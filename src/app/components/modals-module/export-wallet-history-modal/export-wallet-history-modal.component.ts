import { WalletExportService } from '@services/platform/wallet-export-service';
import { CurrencyService } from '@services/platform/currency.service';
import { CoinGeckoApiService } from '@services/api/coin-gecko-api.service';
import { Icons } from '@enums/icons';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { UserContextService } from '@services/utility/user-context.service';
import { UserContext } from '@models/user-context';
import { WalletService } from '@services/platform/wallet.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { Component, OnDestroy } from '@angular/core';
import { saveAs } from 'file-saver';
import { CsvColumns } from '@lookups/wallet-export-csv-columns.lookup';
import { CsvData } from '@models/platform/wallet-export-csv-data';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'opdex-export-wallet-history-modal',
  templateUrl: './export-wallet-history-modal.component.html',
  styleUrls: ['./export-wallet-history-modal.component.scss']
})
export class ExportWalletHistoryModalComponent implements OnDestroy {
  subscription = new Subscription();
  context: UserContext;
  blob: Blob;
  icons = Icons;
  inProgress: boolean = false;
  years = [];
  year = new FormControl<number>(null);

  constructor(
    private _walletService: WalletService,
    private _contextService: UserContextService,
    private _coinGeckoService: CoinGeckoApiService,
    private _currencyService: CurrencyService,
    private _walletExportService: WalletExportService
  ) {
    this.subscription.add(
      this._contextService.context$
        .subscribe(context => this.context = context));

    this._setYearOptions();
  }

  async initDownload(): Promise<void> {
    const year = this.year.value;

    if (this.inProgress || this.blob || !year) return;

    this.inProgress = true;

    const startDate = Date.UTC(this.year.value, 0);
    const endDate = Date.UTC(this.year.value + 1, 0);
    const take = 50;
    let skip = 0;
    let txs: TransactionReceipt[] = [];
    let outOfRange = false;

    while (true && !outOfRange) {
      let transactions = await this._walletService.getWalletHistory(this.context, skip, take);

      const filteredTransactions = transactions.filter(tx => {
        const date = Date.UTC(tx.block.time.getUTCFullYear(), tx.block.time.getUTCMonth(), tx.block.time.getUTCDate());

        if (date >= endDate) {
          outOfRange = true;
          return false;
        }

        return date >= startDate && date < endDate;
      });

      txs.push(...filteredTransactions);
      skip += filteredTransactions.length;
      if (filteredTransactions.length < take) break;
    }

    const currency = this._currencyService.selectedCurrency.abbreviation;
    const priceHistory = await firstValueFrom(this._coinGeckoService.getPriceHistory(currency));
    const csvData = await this._walletExportService.getCsvSummaries(txs, priceHistory, currency);

    this._formatCsv(csvData);
    this.save();
    this.inProgress = false;
  }

  public save(): void {
    if (!this.blob) return;
    saveAs(this.blob, `Opdex_${this.context.wallet.address}_${this.year.value}`);
  }

  private _setYearOptions(): void {
    const start = 2021;
    const now = new Date().getUTCFullYear();
    let index = 0;

    while (!this.years.includes(start)) {
      this.years.push(now - index++);
    }

    this.year.setValue(now);
  }

  private _formatCsv(data: CsvData[]): void {
    const headers = CsvColumns.map(col => col.header).join(',') + '\n';
    const csvData = data.map(summary => {
      return CsvColumns
        .map(col => summary[col.property])
        .join(',');
    }).join('\n');

    this.blob = new Blob([headers + csvData], { type: 'text/csv'});
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
