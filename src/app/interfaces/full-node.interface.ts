export interface ILocalCallResult {
  internalTransfers: any[];
  gasConsumed: IGasConsumed;
  revert: boolean;
  errorMessage: string;
  return: any;
  logs: any[];
}

export interface IGasConsumed {
  value: number;
}

export interface IContractReceiptResult<T> {
  transactionHash: string;
  blockHash: string;
  postState: string;
  gasUsed: number;
  from: string;
  to: string;
  newContractAddress: string;
  success: boolean;
  returnValue: any;
  bloom: string;
  error: string;
  logs: IReceiptLogs<T>[];
}

export interface IReceiptLogs<T> {
  address: string;
  topics: string[];
  data: string;
  log: T;
}

export interface IContractCallResult {
  fee: number;
  hex: string;
  message: string;
  success: boolean;
  transactionId: string;
}

export interface ISmartContractWalletHistory {
  blockHeight: number;
  type: number;
  hash: string;
  to: string;
  amount: number;
  transactionFee: number;
  gasFee: number;
}

export interface ISignalRResponse {
  signalRUri: string;
  signalPort: number;
}

export interface INodeAddressList {
  addresses: INodeWalletAddressModel[]
}

export interface INodeWalletAddressModel {
  address: string;
  isUsed: boolean;
  isChange: boolean;
  amountConfirmed: number;
  amountUncomfirmed: number;
}
