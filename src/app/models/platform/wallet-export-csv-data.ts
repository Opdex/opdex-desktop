export type CsvData = {
  transactionHash: string;
  transactionEventNumber: number;
  blockNumber: number;
  blockTime: string;
  account: 'Cirrus' | 'Opdex';
  gasFeeCrs: string;
  gasFeeFiat: string;
  transactionType: string;
  currency: string;
  amountSpent?: string;
  tokenSpent?: string;
  totalFiatSpent?: string;
  amountReceived?: string;
  tokenReceived?: string;
  totalFiatReceived?: string;
}
