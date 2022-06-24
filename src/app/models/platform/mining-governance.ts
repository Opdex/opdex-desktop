import { Token } from './token';
export class MiningGovernance {
  address: string;
  minedToken: Token;
  nominationPeriodEnd: string;
  miningDuration: number;
  nominations: any[];
}
