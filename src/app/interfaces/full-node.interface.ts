export interface ILocalCallRequest {
  contractAddress: string;
  methodName: string;
  sender: string;
  parameters: string[];
  amount: string;
  gasPrice: number;
  gasLimit: number;
}

export interface ICallRequest extends ILocalCallRequest {
  walletName: string;
  password: string;
  feeAmount: string;
}

export interface ILocalCallResult {
  internalTransfers: any[];
  gasConsumed: IGasConsumed;
  revert: boolean;
  errorMessage: { value: string };
  return: any;
  logs: IReceiptLogs[];
}

export interface ILocalCallErrorResult {
  value: { errors: { status: number; message: string; description: string }[] },
  formatters: any[];
  contentTypes: any[];
  declaredType?: any;
  statusCode: number
}

export interface IGasConsumed {
  value: number;
}

export interface IContractReceiptResult {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  postState: string;
  gasUsed: number;
  from: string;
  to: string;
  newContractAddress: string;
  success: boolean;
  returnValue: any;
  bloom: string;
  error: string;
  logs: IReceiptLogs[];
}

export interface IReceiptLogs {
  address: string;
  topics: string[];
  data: string;
  log: IReceiptLog;
}

export interface IReceiptLog {
  event: string;
  data: any;
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

export interface INodeStatus {
  agent: string;
  version: string;
  network: string;
  coinTicker: string;
  consensusHeight: number;
  headerHeight: number;
  blockStoreHeight: number;
  bestPeerHeight: number;
  dataDirectoryPath: string;
  runningTime: string;
  testnet: boolean;
  relayFee: number;
  state: string;
  inIbd: boolean;
}

export interface ISupportedContract {
  nativeNetwork: string;
  nativeChainAddress: string;
  src20Address: string;
  tokenName: string;
  decimals: number;
}

export interface IWalletsList {
  walletNames: string[];
}

export interface IBlockDetails {
  hash: string;
  confirmations: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string [];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  nextblockhash: string;
  signature: string;
  modifierv2: string;
  flags: string;
  hashproof: string;
  blocktrust: string;
  chaintrust: string;
}
