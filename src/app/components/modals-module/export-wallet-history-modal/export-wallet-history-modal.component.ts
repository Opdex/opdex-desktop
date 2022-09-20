import { Icons } from '@enums/icons';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { UserContextService } from '@services/utility/user-context.service';
import { UserContext } from '@models/user-context';
import { WalletService } from '@services/platform/wallet.service';
import { Subscription } from 'rxjs';
import { Component, OnDestroy } from '@angular/core';
import { saveAs } from 'file-saver';

const CsvColumns = [
  { header: 'Transaction Hash', property: 'transactionHash' },
  { header: 'Transaction Event No.', property: 'transactionEventNumber' },
  { header: 'Block Number', property: 'blockNumber' },
  { header: 'Block Time', property: 'blockTime' },
  { header: 'Account', property: 'account' },
  { header: 'Gas Fee (CRS)', property: 'gasFeeCrs' },
  { header: 'Gas Fee (Fiat)', property: 'gasFeeFiat' },
  { header: 'Transaction Type', property: 'transactionType' },
  { header: 'Amount Spent', property: 'amountSpent' },
  { header: 'Token Spent', property: 'tokenSpent' },
  { header: 'Total Fiat Spent', property: 'totalFiatSpent' },
  { header: 'Amount Received', property: 'amountReceived' },
  { header: 'Token Received', property: 'tokenReceived' },
  { header: 'Total Fiat Received', property: 'totalFiatReceived' },
];

export type CsvData = {
  transactionHash: string;
  transactionEventNumber: number;
  blockNumber: number;
  blockTime: string;
  account: 'Cirrus' | 'Opdex';
  gasFeeCrs: string;
  gasFeeFiat: number;
  transactionType: string;
  amountSpent?: string;
  tokenSpent?: string;
  totalFiatSpent?: string;
  amountReceived?: string;
  tokenReceived?: string;
  totalFiatReceived?: string;
}

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
    private _contextService: UserContextService
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

    console.log(txs);

    // Todo: For each tx
    // -------- Get Tx summary data (from feed)
    // -------- Get CsvData

    // Todo: pass in CsvData
    this._formatCsv(txs);
    this.save();
    this.inProgress = false;
  }

  public save(): void {
    if (!this.blob) return;
    saveAs(this.blob, 'Wallet History');
  }

  private _formatCsv(txs: TransactionReceipt[]): void {
    const headers = CsvColumns.map(col => col.header).join(',') + '\n';

    const data = txs.map(tx => {
      return CsvColumns.map(col => {
        const { header, property } = col;
        // transactionHash
        if (header === CsvColumns[0].header) return tx.hash
        // transactionEventNumber
        else if (header === CsvColumns[1].header) return '0';
        // blockNumber
        else if (header === CsvColumns[2].header) return tx.block.height;
        // blockTime
        else if (header === CsvColumns[3].header) return this._getUtcDate(tx.block.time)
        // account
        else if (header === CsvColumns[4].header) return tx.isOpdexTx ? 'Opdex' : 'Cirrus';
        // gasFeeCrs
        // If eventNo !== 0 then set to 0, first event only has gas fee
        else if (header === CsvColumns[5].header) return tx.gasCost.formattedValue;
        // gasFeeFiat
        // If eventNo !== 0 then set to 0, first event only has gas fee
        else if (header === CsvColumns[6].header) return ''
        // transactionType
        else if (header === CsvColumns[7].header) return tx.transactionSummary;
        // amountSpent
        else if (header === CsvColumns[8].header) return ''
        // tokenSpent
        else if (header === CsvColumns[9].header) return ''
        // totalFiatSpent
        else if (header === CsvColumns[10].header) return ''
        // amountReceived
        else if (header === CsvColumns[11].header) return ''
        // tokenReceived
        else if (header === CsvColumns[12].header) return ''
        // totalFiatReceived
        else if (header === CsvColumns[13].header) return ''
        // Default - Shouldn't happen
        else return '';
      }).join(',');
    }).join('\n');

    this.blob = new Blob([headers + data], { type: 'text/csv'});
  }

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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
