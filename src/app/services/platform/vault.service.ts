import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { VaultStateKeys } from "@enums/contracts/state-keys/vault-state-keys";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { EnvironmentsService } from "@services/utility/environments.service";
import { zip, map } from "rxjs";

@Injectable({providedIn: 'root'})
export class VaultService {
  constructor(
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  getHydratedVault() {
    const vault = this._env.contracts.vault;

    const properties = [
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.Token, ParameterType.Address),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.VestingDuration, ParameterType.ULong),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalProposedAmount, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalPledgeMinimum, ParameterType.ULong),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalVoteMinimum, ParameterType.ULong),
    ];

    return zip(properties)
      .pipe(
        map(([token, totalSupply, vestingDuration, totalProposedAmount, totalPledgeMinimum, totalVoteMinimum]) => {
          return { token, totalSupply, vestingDuration, totalProposedAmount, totalPledgeMinimum, totalVoteMinimum };
        }));
  }
}
