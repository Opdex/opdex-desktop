import { EnvironmentsService } from '@services/utility/environments.service';
import { Injectable, Injector } from "@angular/core";
import { IContractCallResult, IContractReceiptResult, ILocalCallResult, INodeAddressList, INodeStatus, ISignalRResponse, ISmartContractWalletHistory, ISupportedContract } from "@interfaces/full-node.interface";
import { catchError, map, Observable, of } from "rxjs";
import { RestApiService } from "./rest-api.service";
import { CallRequest, LocalCallRequest } from '@models/cirrusApi/contract-call';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { ParameterType } from '@enums/parameter-type';
import { CacheService } from '@services/utility/cache.service';
import { Network } from '@enums/networks';

@Injectable({providedIn: 'root'})
export class CirrusApiService extends CacheService {
  api: string = `${this._env.cirrusApi}/api`;

  constructor(
    protected _injector: Injector,
    private _rest: RestApiService,
    private _env: EnvironmentsService
  ) {
    super(_injector);
  }

  // Signalr
  getConnectionInfo(): Observable<ISignalRResponse> {
    return this._rest.get<ISignalRResponse>(`${this.api}/SignalR/getConnectionInfo`);
  }

  // Node
  getNodeStatus():Observable<INodeStatus | undefined> {
    // No caching this call
    return this._rest
      .get<INodeStatus>(`${this.api}/Node/status`)
      .pipe(catchError(_ => of(undefined)));
  }

  // Wallets
  getWalletsList(): Observable<{walletNames: string[]}> {
    return this._rest.get(`${this.api}/Wallet/list-wallets`);
  }

  loadWallet(payload: { name: string, password: string }):Observable<any> {
    return this._rest.post(`${this.api}/Wallet/load`, payload);
  }

  getAddresses(walletName: string):Observable<INodeAddressList> {
    return this._rest.get(`${this.api}/Wallet/addresses?walletName=${walletName}&account=account%200`);
  }

  getAddressBalance(address: string):Observable<number> {
    return this._rest.get(`${this.api}/SmartContractWallet/address-balance?address=${address}`);
  }

  getHistory(walletName: string, address: string):Observable<ISmartContractWalletHistory[]> {
    return this._rest.get(`${this.api}/SmartContractWallet/history?walletName=${walletName}&address=${address}`);
  }

  // Smart Contracts
  getContractReceipt(txHash: string): Observable<IContractReceiptResult> {
    const endpoint = `${this.api}/SmartContracts/receipt?txHash=${txHash}`;
    const observable$ = this._rest.get<IContractReceiptResult>(endpoint);
    return this.getItem(endpoint, observable$);
  }

  searchContractReceipts(request: ReceiptSearchRequest): Observable<IContractReceiptResult[]> {
    const endpoint = `${this.api}/SmartContracts/receipt-search${request.query}`;
    return this._rest.get<IContractReceiptResult[]>(endpoint);
  }

  localCall(request: LocalCallRequest): Observable<ILocalCallResult> {
    return this._rest.post(`${this.api}/SmartContracts/local-call`, request.payload);
  }

  call(request: CallRequest): Observable<IContractCallResult> {
    return this._rest.post(`${this.api}/SmartContractWallet/call`, request.payload);
  }

  getContractStorageItem(contractAddress: string, storageKey: string, dataType: ParameterType): Observable<string> {
    const endpoint = `${this.api}/SmartContracts/storage?contractAddress=${contractAddress}&storageKey=${storageKey}&dataType=${dataType}`;
    const observable$ = this._rest.get<string | { message: string }>(endpoint)
      .pipe(map(response => {
          if (typeof(response) !== 'string') throw new Error(response.message);
          return response;
        }));

    return this.getItem(endpoint, observable$);
  }

  // Supported Contracts
  getSupportedInterfluxTokens(): Observable<ISupportedContract[]> {
    // 0 = mainnet, 1 = testnet
    const networkType = this._env.network === Network.Mainnet ? '0' : '1';
    const endpoint = `${this.api}/SupportedContracts/list?networkType=${networkType}`;
    const observable$ = this._rest.get<ISupportedContract[]>(endpoint);

    // cache for 5400 blocks
    return this.getItem(endpoint, observable$, 5400);
  }
}
