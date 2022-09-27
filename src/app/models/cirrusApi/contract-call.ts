import { ParameterType } from '@enums/parameter-type';
import { ICallRequest, ILocalCallRequest } from '@interfaces/full-node.interface';
import { ITransactionQuoteRequest } from '@interfaces/transaction-quote.interface';

abstract class CallRequestBase {
  contractAddress: string;
  methodName: string;
  sender: string;
  parameters: Parameter[];
  amount: string;
  gasPrice: number;
  gasLimit: number;
  blockHeight: number;

  constructor(
    contractAddress: string,
    methodName: string,
    sender: string,
    parameters: Parameter[] = [],
    amount: string = '0',
    blockHeight: number = undefined,
    gasLimit: number = 250000,
    gasPrice: number = 100,
  ) {
    this.contractAddress = contractAddress;
    this.methodName = methodName;
    this.sender = sender;
    this.parameters = parameters;
    this.amount = amount;
    this.gasLimit = gasLimit;
    this.gasPrice = gasPrice;
    this.blockHeight = blockHeight;
  }
}

export class CallRequest extends CallRequestBase {
  walletName: string;
  password: string;
  feeAmount: string;

  constructor(
    contractAddress: string,
    walletName: string,
    password: string,
    methodName: string,
    sender: string,
    parameters: Parameter[] = [],
    amount: string = '0',
    feeAmount: string = '.001'
  ) {
    super(contractAddress, methodName, sender, parameters, amount);
    this.walletName = walletName;
    this.password = password;
    this.feeAmount = feeAmount;
  }

  public get payload(): ICallRequest {
    return {
      contractAddress: this.contractAddress,
      methodName: this.methodName,
      sender: this.sender,
      parameters: this.parameters.map(param => param.result),
      amount: this.amount,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      walletName: this.walletName,
      feeAmount: this.feeAmount,
      password: this.password
    }
  }
}

export class LocalCallRequest extends CallRequestBase {
  constructor(
    contractAddress: string,
    methodName: string,
    sender: string,
    parameters: Parameter[] = [],
    amount = '0',
    blockHeight = undefined
  ) {
    super(contractAddress, methodName, sender, parameters, amount, blockHeight);
  }

  public get cacheKey(): string {
    let key = this.contractAddress;
    key += `-${this.methodName}`;
    key += `-${this.sender}`;
    key += `-${this.amount}`;
    key += `-${this.blockHeight}`

    this.parameters.forEach(param => key += param.result);

    return key;
  }

  public get payload(): ILocalCallRequest {
    return {
      contractAddress: this.contractAddress,
      methodName: this.methodName,
      sender: this.sender,
      parameters: this.parameters.map(param => param.result),
      amount: this.amount,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      blockHeight: this.blockHeight
    }
  }

  public get txHandoff(): ITransactionQuoteRequest {
    return {
      sender: this.sender,
      to: this.contractAddress,
      amount: this.amount,
      method: this.methodName,
      parameters: this.parameters.map(param => {
        return {
          label: param.label,
          value: param.result
        }
      }),
      callback: null
    }
  }
}

export class Parameter {
  type: ParameterType;
  value: string | number;
  label: string;
  result: string;

  constructor(type: ParameterType, value: string | number, label?: string) {
    this.type = type;
    this.value = value;
    this.label = label;
    this.result = `${type}#${value}`;
  }
}
