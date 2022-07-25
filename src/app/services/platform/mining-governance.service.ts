import { EnvironmentsService } from '@services/utility/environments.service';
import { MiningGovernanceApiService } from '@services/api/smart-contracts/mining-governance-api.service';
import { Injectable } from "@angular/core";
import { MiningGovernance } from "@models/platform/mining-governance";
import { firstValueFrom } from 'rxjs';
import { LocalCallPayload } from '@models/cirrusApi/contract-calls/local-call';

@Injectable({providedIn: 'root'})
export class MiningGovernanceService {
  constructor(
    private _miningGovernanceApi: MiningGovernanceApiService,
    private _env: EnvironmentsService
  ) { }

  public async buildMiningGovernance(latestBlock: number): Promise<MiningGovernance> {
    const hydrated = await firstValueFrom(this._miningGovernanceApi.getHydratedMiningGovernance());
    return new MiningGovernance(hydrated, latestBlock);
  }

  public async rewardMiningPools(wallet: string) {
    this._miningGovernanceApi.rewardMiningPools(wallet);
  }
}
