import { CallBase } from './call-base';
import { Parameter } from './parameter';

export class CallPayload extends CallBase {
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
}
