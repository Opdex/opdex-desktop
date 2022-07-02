import { CallBase } from './call-base';
import { Parameter } from './parameter';

export class LocalCallPayload extends CallBase {
  constructor(
    contractAddress: string,
    methodName: string,
    sender: string,
    parameters: Parameter[] = [],
    amount = '0'
  ) {
    super(contractAddress, methodName, sender, parameters, amount);
  }
}
