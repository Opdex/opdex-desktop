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
  fiatSpent?: string;
  amountReceived?: string;
  tokenReceived?: string;
  fiatReceived?: string;
}
