import { ILocalCallResult } from '@interfaces/full-node.interface';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { LocalCallRequest } from '@models/cirrusApi/contract-call';

export interface ITransactionQuote {
  result: any;
  error: ITransactionError;
  gasUsed: number;
  events: ITransactionEvent[];
  request: LocalCallRequest;
  txHandoff: ITransactionQuoteRequest;
  response: ILocalCallResult;
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
