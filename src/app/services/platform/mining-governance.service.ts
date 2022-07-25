import { MiningGovernanceApiService } from '@services/api/smart-contracts/mining-governance-api.service';
import { Injectable } from "@angular/core";
import { MiningGovernance } from "@models/platform/mining-governance";
import { firstValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class MiningGovernanceService {
  constructor(private _miningGovernanceApi: MiningGovernanceApiService) { }

  public async buildMiningGovernance(latestBlock: number): Promise<MiningGovernance> {
    const hydrated = await firstValueFrom(this._miningGovernanceApi.getHydratedMiningGovernance());
    return new MiningGovernance(hydrated, latestBlock);
  }
}
