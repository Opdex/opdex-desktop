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
    if (this.inProgress || this.blob) return;
    this.inProgress = true;

    const take = 50;
    let skip = 0;
    let txs: TransactionReceipt[] = [];

    while (true) {
      let transactions = await this._walletService.getWalletHistory(this.context, skip, take);
      txs.push(...transactions);
      skip += transactions.length;
      if (transactions.length < take) break;
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
