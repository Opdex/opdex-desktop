import { Network } from '@enums/networks';

export interface IEnvironment {
  network: Network;
  cirrusApi: string;
  contracts: IEnvironmentContracts;
}

export interface IEnvironmentContracts {
  deployer: string;
  router: string;
  market: string;
  vault: string;
  miningGovernance: string;
  odx: string;
}
