import { EnvironmentsService } from '@services/utility/environments.service';
import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { VaultService } from './../platform/vault.service';
import { Injectable } from "@angular/core";
import { Vault } from '@models/platform/vault';
import { firstValueFrom } from 'rxjs';
import { VaultCertificate } from '@models/platform/vault-certificate';
import { VaultProposal } from '@models/platform/vault-proposal';

@Injectable({providedIn: 'root'})
export class VaultFactoryService {
  constructor(
    private _vaultService: VaultService,
    private _vaultRepository: VaultRepositoryService,
    private _env: EnvironmentsService
  ) { }

  async getVault(): Promise<Vault> {
    const hydrated = await firstValueFrom(this._vaultService.getHydratedVault());
    return new Vault(this._env.contracts.vault, hydrated);
  }

  async getProposal(proposalId: number): Promise<VaultProposal> {
    const hydrated = await firstValueFrom(this._vaultService.getHydratedProposal(proposalId));
    const entity = await this._vaultRepository.getProposalById(proposalId);
    return new VaultProposal(this._env.contracts.vault, this._env.contracts.odx, proposalId, entity, hydrated)
  }

  async getCertificates(): Promise<VaultCertificate[]> {
    const entities = await this._vaultRepository.getCertificates();
    return entities.map(entity => new VaultCertificate(entity));
  }
}
