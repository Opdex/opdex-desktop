import { ILocalCallResult } from '@interfaces/full-node.interface';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { LocalCallRequest } from '@models/cirrusApi/contract-call';

export interface ITransactionQuote {
  result: any;
  error: ITransactionError;
  gasUsed: number;
  events: ITransactionEvent[];
  request: ITransactionQuoteRequest;
}

export interface ITransactionError {
  raw: string;
  friendly: string;
}

export interface ITransactionEvent {
  sortOrder: number;
  eventType: TransactionLogTypes;
  contract: string;
}

export interface ITransactionQuoteRequest {
  sender: string;
  to: string;
  amount: string;
  method: string;
  parameters: ITransactionQuoteParameter[];
  callback: string;
}

export interface ITransactionQuoteParameter {
  label: string;
  value: string;
}

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
