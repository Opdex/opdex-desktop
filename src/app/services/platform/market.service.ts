import { UserContextService } from '@services/utility/user-context.service';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { Injectable } from "@angular/core";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { firstValueFrom, map, Observable } from 'rxjs';
import { EnvironmentsService } from '@services/utility/environments.service';
import { MarketMethods } from '@enums/contracts/methods/market-methods';
import { ParameterType } from '@enums/parameter-type';
import { LocalCallRequest, Parameter } from '@models/cirrusApi/contract-call';
import { TransactionQuote } from '@models/platform/transaction-quote';

@Injectable({providedIn: 'root'})
export class MarketService {
  private _market: string;

  constructor(
    private _cirrusApi: CirrusApiService,
    private _env: EnvironmentsService,
    private _context: UserContextService
  ) {
    this._market = this._env.contracts.market;
  }

  public async createLiquidityPoolQuote(token: string): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // Address CreatePool(Address token);
    const request = new LocalCallRequest(this._market, MarketMethods.CreatePool, wallet.address, [
      new Parameter(ParameterType.Address, token, 'Token')
    ]);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  getMarketPools(fromBlock: number, endBlock: number): Observable<any> {
    const createPoolLog = TransactionLogTypes.CreateLiquidityPoolLog;
    const request = new ReceiptSearchRequest(this._market, fromBlock, createPoolLog, endBlock);

    return this._cirrusApi.searchContractReceipts(request)
      .pipe(
        map(response => {
          const pools = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === createPoolLog)
              .forEach(log => pools.push({...log.log.data, createdBlock: tx.blockNumber}));
          });

          return pools;
      }));
  }
}
