import { ParseFriendlyErrorMessage } from '@lookups/contract-errors.lookup';
import { IContractReceiptResult, ILocalCallResult } from "@interfaces/full-node.interface";
import { ITransactionQuote, ITransactionError, ITransactionEvent, ITransactionQuoteRequest } from "@interfaces/transaction-quote.interface";
import { LocalCallRequest } from "@models/cirrusApi/contract-call";
import { TransactionReceipt } from "./transactionReceipt";

export class TransactionQuote implements ITransactionQuote {
  private _request: LocalCallRequest;
  private _response: ILocalCallResult;
  private _error: ITransactionError;

  constructor(request: LocalCallRequest, response: ILocalCallResult) {
    this._response = response;
    this._request = request;

    if (this._response?.errorMessage) {
      const { value } = this._response.errorMessage;

      this._error = {
        raw: value,
        friendly: ParseFriendlyErrorMessage(value)
      };
    }
  }

  public get request(): LocalCallRequest {
    return this._request;
  }

  public get response(): ILocalCallResult {
    return this._response;
  }

  public get error(): ITransactionError {
    return this._error;
  }

  public get events(): ITransactionEvent[] {
    return this._response.logs.map((log, i) => {
      return {
        sortOrder: i,
        contract: log.address,
        eventType: log.log.event,
        ...log.log.data
      }
    })
  }

  public get gasUsed(): number {
    return this._response.gasConsumed.value;
  }

  public get result(): any {
    return this._response.return;
  }

  public get txHandoff(): ITransactionQuoteRequest {
    return this._request.txHandoff;
  }

  public get receipt(): TransactionReceipt {
    return new TransactionReceipt({
      gasUsed: this.gasUsed,
      from: this._request.sender,
      to: this._request.contractAddress,
      success: !!this._response.errorMessage?.value === false,
      logs: this._response.logs,
      bloom: null,
      error: this._response.errorMessage?.value
    } as IContractReceiptResult)
  }
}
