import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';

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
