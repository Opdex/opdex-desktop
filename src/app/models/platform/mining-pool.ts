import { Token } from './token';

export class MiningPool {
  address: string;
  stakingToken: Token;
  minedToken: Token;
  miningPeriodEndBlock: number;
  isActive: boolean;

  constructor() {

  }
}
