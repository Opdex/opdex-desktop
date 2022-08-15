import { Network } from "@enums/networks";
import { version } from '../../package.json';

export const environment = {
  production: true,
  network: Network.Mainnet,
  version: version
};
