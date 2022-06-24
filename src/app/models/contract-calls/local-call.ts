import { CallBase } from './call-base';
import { Parameter } from './parameter';

export class LocalCallPayload extends CallBase {
  constructor(
    contractAddress: string,
    methodName: string,
    sender: string,
    parameters: Parameter[] = [],
    amount: string = '0',
    gasLimit: number = 250000,
    gasPrice: number = 100
  ) {
    super(contractAddress, methodName, sender, parameters, amount, gasLimit, gasPrice);
  }
}
