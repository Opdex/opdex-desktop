import { Parameter } from './parameter';

export abstract class CallBase {
  contractAddress: string;
  methodName: string;
  sender: string;
  parameters: string[];
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
    this.parameters = parameters.map(param => param.result);
    this.amount = amount;
    this.gasLimit = gasLimit;
    this.gasPrice = gasPrice;
  }
}
