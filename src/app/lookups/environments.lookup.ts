import { Network } from "@enums/networks";
import { IEnvironment } from "@interfaces/environment.interface";

export const Environments: IEnvironment[] = [
  {
    network: Network.Mainnet,
    cirrusApi: 'http://localhost:37223',
    contracts: {
      deployer: 'CUG9qFQbzQKyDYos9UywG2aodJ6S45wqA6',
      router: 'CeNa4b95h9YqDc1UZ2YCqmeqXXKqeDdAYW',
      market: 'CGmbx89aJdVtFGEUMZfdbRntYkGJgwjUrv',
      vault: 'CTzsaNA1yTQwD3YNkZkJQbwupczAnaVW6Q',
      miningGovernance: 'CYrKKCyrq816j4nXS1k1cuXagEJWmmjdup',
      odx: 'CUAQPZkWat7ECSFoGCMPfdnF5rZbSF92zL'
    }
  }, {
    network: Network.Testnet,
    cirrusApi: 'http://localhost:38223',
    contracts: {
      deployer: 'tJi67WDN6uoSRWgqTWr3Gmobc5xQ3AEfnC',
      router: 'tAFxpxRdcV9foADqD6gK3c8sY5MeANzFp5',
      market: 't7RorA7xQCMVYKPM1ibPE1NSswaLbpqLQb',
      vault: 't7hy4H51KzU6PPCL4QKCdgBGPLV9Jpmf9G',
      miningGovernance: 'tKFkNiL5KJ3Q4br929i6hHbB4X4mt1MigF',
      odx: 'tTTuKbCR2UnsEByXBp1ynBz91J2yz63h1c'
    }
  }
]
