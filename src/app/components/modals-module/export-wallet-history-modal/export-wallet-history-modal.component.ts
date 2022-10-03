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
import { FormGroup, FormControl } from '@angular/forms';

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
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

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
  }

  async initDownload(): Promise<void> {
    const { start, end } = this.range.value;

    if (this.inProgress || this.blob || !start || !end) return;

    this.inProgress = true;

    const startDate = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endDate = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    const take = 50;
    let skip = 0;
    let txs: TransactionReceipt[] = [];
    let outOfRange = false;

    while (true && !outOfRange) {
      let transactions = await this._walletService.getWalletHistory(this.context, skip, take);

      const filteredTransactions = transactions.filter(tx => {
        const date = Date.UTC(tx.block.time.getUTCFullYear(), tx.block.time.getUTCMonth(), tx.block.time.getUTCDate());

        if (date > endDate) {
          outOfRange = true;
          return false;
        }

        return date >= startDate && date <= endDate;
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
    saveAs(this.blob, 'Wallet History');
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
