import { EnvironmentsService } from '@services/utility/environments.service';
import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { VaultService } from './../platform/vault.service';
import { Injectable } from "@angular/core";
import { Vault } from '@models/platform/vault';
import { firstValueFrom } from 'rxjs';
import { VaultCertificate } from '@models/platform/vault-certificate';

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

  async getCertificates(): Promise<VaultCertificate[]> {
    const entities = await this._vaultRepository.getCertificates();
    return entities.map(entity => new VaultCertificate(entity));
  }
}
