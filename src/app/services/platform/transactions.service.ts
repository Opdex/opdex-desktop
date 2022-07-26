import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { firstValueFrom } from 'rxjs';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { Injectable } from "@angular/core";
import { CirrusApiService } from "@services/api/cirrus-api.service";

@Injectable({providedIn: 'root'})
export class TransactionsService {
  constructor(
    private _cirrus: CirrusApiService
  ) { }

  async searchTransactionReceipts(request: ReceiptSearchRequest) {
    const txs = await firstValueFrom(this._cirrus.searchContractReceipts(request));
    return txs.map(tx => new TransactionReceipt(tx));
  }

  public replayTransactionQuote() { }
}
