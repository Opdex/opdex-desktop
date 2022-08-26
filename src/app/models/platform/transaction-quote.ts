import { ParseFriendlyErrorMessage } from '@lookups/contract-errors.lookup';
import { IContractReceiptResult, ILocalCallResult } from "@interfaces/full-node.interface";
import { ITransactionQuote, ITransactionError, ITransactionEvent, ITransactionQuoteRequest } from "@interfaces/transaction-quote.interface";
import { LocalCallRequest } from "@models/cirrusApi/contract-call";
import { TransactionReceipt } from "./transactionReceipt";

export class TransactionQuote implements ITransactionQuote {
  request: LocalCallRequest;
  response: ILocalCallResult;
  error: ITransactionError;

  constructor(request: LocalCallRequest, response: ILocalCallResult) {
    this.response = response;
    this.request = request;

    if (this.response?.errorMessage) {
      const { value } = this.response.errorMessage;

      this.error = {
        raw: value,
        friendly: ParseFriendlyErrorMessage(value)
      };
    }
  }

  public get events(): ITransactionEvent[] {
    return this.response.logs.map((log, i) => {
      return {
        sortOrder: i,
        contract: log.address,
        eventType: log.log.event,
        ...log.log.data
      }
    })
  }

  public get gasUsed(): number {
    return this.response.gasConsumed.value;
  }

  public get result(): any {
    return this.response.return;
  }

  public get txHandoff(): ITransactionQuoteRequest {
    return this.request.txHandoff;
  }

  public get receipt(): TransactionReceipt {
    return new TransactionReceipt({
      gasUsed: this.gasUsed,
      from: this.request.sender,
      to: this.request.contractAddress,
      success: !!this.response.errorMessage?.value === false,
      logs: this.response.logs,
      bloom: null,
      error: this.response.errorMessage?.value
    } as IContractReceiptResult)
  }
}
