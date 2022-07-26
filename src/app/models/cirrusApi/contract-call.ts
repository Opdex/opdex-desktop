import { ParameterType } from '@enums/parameter-type';
import { ICallRequest, ILocalCallRequest } from '@interfaces/full-node.interface';

abstract class CallRequestBase {
  contractAddress: string;
  methodName: string;
  sender: string;
  parameters: Parameter[];
  amount: string;
  gasPrice: number;
  gasLimit: number;

  constructor(
    contractAddress: string,
    methodName: string,
    sender: string,
    parameters: Parameter[] = [],
    amount: string = '0',
    gasLimit: number = 250000,
    gasPrice: number = 100
  ) {
    this.contractAddress = contractAddress;
    this.methodName = methodName;
    this.sender = sender;
    this.parameters = parameters;
    this.amount = amount;
    this.gasLimit = gasLimit;
    this.gasPrice = gasPrice;
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
    amount = '0'
  ) {
    super(contractAddress, methodName, sender, parameters, amount);
  }

  public get payload(): ILocalCallRequest {
    return {
      contractAddress: this.contractAddress,
      methodName: this.methodName,
      sender: this.sender,
      parameters: this.parameters.map(param => param.result),
      amount: this.amount,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit
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

