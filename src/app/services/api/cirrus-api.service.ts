import { Router } from '@angular/router';
import { Injectable } from "@angular/core";
import { IContractCallResult, IContractReceiptResult, ILocalCallResult, INodeAddressList, INodeStatus, ISignalRResponse, ISmartContractWalletHistory, ISupportedContract } from "@interfaces/full-node.interface";
import { map, Observable } from "rxjs";
import { RestApiService } from "./rest-api.service";
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { CallPayload } from '@models/cirrusApi/contract-calls/call';
import { LocalCallPayload } from '@models/cirrusApi/contract-calls/local-call';
import { ReceiptSearchRequest } from '@models/cirrusApi/requests/receipt-search.request';
import { ParameterType } from '@enums/parameter-type';

@Injectable({providedIn: 'root'})
export class CirrusApiService extends RestApiService {
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
  getNodeStatus():Observable<INodeStatus> {
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
    return this.get(`${this.api}/Wallet/addresses?walletName=${walletName}`);
  }

  getAddressBalance(address: string):Observable<number> {
    return this.get(`${this.api}/SmartContractWallet/address-balance?address=${address}`);
  }

  getHistory(walletName: string, address: string):Observable<ISmartContractWalletHistory[]> {
    return this.get(`${this.api}/SmartContractWallet/history?walletName=${walletName}&address=${address}`);
  }

  // Smart Contracts
  getContractReceipt(txHash: string): Observable<IContractReceiptResult> {
    return this.get(`${this.api}/SmartContracts/receipt?txHash=${txHash}`);
  }

  searchContractReceipts(request: ReceiptSearchRequest): Observable<IContractReceiptResult[]> {
    return this.get(`${this.api}/SmartContracts/receipt-search${request.query}`);
  }

  localCall(payload: LocalCallPayload): Observable<ILocalCallResult> {
    return this.post(`${this.api}/SmartContracts/local-call`, payload);
  }

  call(payload: CallPayload): Observable<IContractCallResult> {
    return this.post(`${this.api}/SmartContractWallet/call`, payload);
  }

  getContractStorageItem(contractAddress: string, storageKey: string, dataType: ParameterType): Observable<string> {
    return this.get<string | { message: string }>(`${this.api}/SmartContracts/storage?contractAddress=${contractAddress}&storageKey=${storageKey}&dataType=${dataType}`)
      .pipe(map(response => {
          if (typeof(response) !== 'string') throw new Error(response.message);
          return response;
        }));
  }

  // Supported Contracts
  getSupportedInterfluxTokens(): Observable<ISupportedContract[]> {
    const networkType = '0'; // 0 = mainnet, 1 = testnet
    return this.get(`${this.api}/SupportedContracts/list?networkType=${networkType}`);
  }
}
