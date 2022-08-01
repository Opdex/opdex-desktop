import { FixedDecimal } from './types/fixed-decimal';
import { Token } from '@models/platform/token';

export class AllowanceValidation {
  owner: string;
  spender: string;
  token: Token;
  allowance: FixedDecimal;
  requestToSpend: FixedDecimal;
  isApproved: boolean;

  constructor(owner: string, spender: string, allowance: BigInt, requestToSpend: string, token: Token) {
    this.owner = owner;
    this.spender = spender;
    this.allowance = FixedDecimal.FromBigInt(allowance, token.decimals);
    this.requestToSpend = new FixedDecimal(requestToSpend, token.decimals);
    this.token = token;
    this.isApproved = this.requestToSpend.bigInt <= this.allowance.bigInt;
  }

  update(amount: BigInt) {
    this.allowance = FixedDecimal.FromBigInt(amount, this.token.decimals);
    this.isApproved = this.requestToSpend.bigInt <= this.allowance.bigInt;
  }
}
