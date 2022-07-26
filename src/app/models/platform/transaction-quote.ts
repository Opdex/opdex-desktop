import { ILocalCallResult } from "@interfaces/full-node.interface";
import { ITransactionQuote, ITransactionError, ITransactionEvent, ITransactionQuoteRequest } from "@interfaces/transaction-quote.interface";
import { LocalCallRequest } from "@models/cirrusApi/contract-call";

export class TransactionQuote implements ITransactionQuote {
  result: any;
  error: ITransactionError;
  gasUsed: number;
  events: ITransactionEvent[];
  request: ITransactionQuoteRequest;

  constructor(request: LocalCallRequest, response: ILocalCallResult) {
    this.result = response.return;
    this.error = {
      raw: response.errorMessage,
      friendly: ''
    };
    this.gasUsed = response.gasConsumed.value;
    this.request = {
      sender: request.sender,
      to: request.contractAddress,
      amount: request.amount,
      method: request.methodName,
      parameters: request.parameters.map(param => {
        return {
          label: param.label,
          value: param.result
        }
      }),
      callback: null
    };
    this.events = response.logs.map((log, i) => {
      return {
        sortOrder: i,
        contract: log.address,
        eventType: log.log.event,
        ...log.log.data
      }
    })
  }
}
