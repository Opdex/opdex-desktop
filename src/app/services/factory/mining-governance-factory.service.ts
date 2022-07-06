import { MiningGovernanceService } from '@services/platform/mining-governance.service';
import { Injectable } from "@angular/core";
import { MiningGovernance } from "@models/platform/mining-governance";
import { lastValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class MiningGovernanceFactoryService {
  constructor(private _miningGovernanceService: MiningGovernanceService) { }

  public async buildMiningGovernance(latestBlock: number): Promise<MiningGovernance> {
    const hydrated = await lastValueFrom(this._miningGovernanceService.getHydratedMiningGovernance());
    return new MiningGovernance(hydrated, latestBlock);
  }
}