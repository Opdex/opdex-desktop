import { MiningService } from '@services/platform/mining.service';
import { Injectable } from "@angular/core";
import { MiningGovernance } from "@models/platform/mining-governance";
import { lastValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class MiningGovernanceFactoryService {
  constructor(private _miningService: MiningService) { }

  public async buildMiningGovernance(latestBlock: number): Promise<MiningGovernance> {
    const hydrated = await lastValueFrom(this._miningService.getHydratedMiningGovernance());
    return new MiningGovernance(hydrated, latestBlock);
  }
}
