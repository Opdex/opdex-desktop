import { Router } from '@angular/router';
import { Injectable } from "@angular/core";
import { IContractCallResult, IContractReceiptResult, ILocalCallResult, INodeAddressList, ISignalRResponse, ISmartContractWalletHistory } from "@interfaces/full-node.interface";
import { Observable } from "rxjs";
import { RestApiService } from "./rest-api.service";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { CallPayload } from '@models/contract-calls/call';
import { LocalCallPayload } from '@models/contract-calls/local-call';

@Injectable({providedIn: 'root'})
export class ApiService extends RestApiService {
  api: string = `${environment.cirrusApi}:${environment.cirrusPort}/api`;

  constructor(
    protected _http: HttpClient,
    protected _router: Router
  ) {
    super(_http, _router);
  }

  // Signalr
  getConnectionInfo(): Observable<ISignalRResponse> {
    return this.get<ISignalRResponse>(`${this.api}/SignalR/getConnectionInfo`);
  }

  // Node
  getNodeStatus():Observable<any> {
    return this.get(`${this.api}/Node/status`);
  }

  // Wallets
  getWalletsList(): Observable<{walletNames: string[]}> {
    return this.get(`${this.api}/Wallet/list-wallets`);
  }

  loadWallet(payload: { name: string, password: string }):Observable<any> {
    return this.post(`${this.api}/Wallet/load`, payload);
  }

  getAddresses(walletName: string):Observable<INodeAddressList> {
    return this.get<INodeAddressList>(`${this.api}/Wallet/addresses?walletName=${walletName}`);
  }

  getAddressBalance(address: string):Observable<number> {
    return this.get(`${this.api}/SmartContractWallet/address-balance?address=${address}`);
  }

  getHistory(walletName: string, address: string):Observable<ISmartContractWalletHistory[]> {
    return this.get(`${this.api}/SmartContractWallet/history?walletName=${walletName}&address=${address}`);
  }

  // Smart Contracts
  getContractReceipt(txHash: string): Observable<IContractReceiptResult<any>> {
    return this.get(`${this.api}/SmartContracts/receipt?txHash=${txHash}`);
  }

  searchContractReceipts(request: any): Observable<any[]> {
    // Todo: add topics
    // Todo: add request model
    // Todo: add response model
    return this.get(`${this.api}/SmartContracts/receipt-search?contractAddress=${request.address}&eventName=${request.eventName}&fromBlock=${request.fromBlock}&toBlock=${request.toBlock}`);
  }

  localCall(payload: LocalCallPayload): Observable<ILocalCallResult> {
    return this.post(`${this.api}/SmartContracts/local-call`, payload);
  }

  call(payload: CallPayload): Observable<IContractCallResult> {
    return this.post(`${this.api}/SmartContractWallet/call`, payload);
  }

  getContractStorageItem(contractAddress: string, storageKey: string, dataType: string): Observable<string | { message: string }> {
    const response = this.get<string | { message: string }>(`${this.api}/SmartContracts/storage?contractAddress=${contractAddress}&storageKey=${storageKey}&dataType=${dataType}`);

    // If a key isn't found, it doesn't error, just returns a message.
    // if (response?.message?.includes('No data at storage with key')) {
    //   response.hasError = true;
    //   response.error = new HttpErrorResponse({ error: response.data.message });
    //   this._log.error(response.data.message);
    // }

    return response;
  }
}
