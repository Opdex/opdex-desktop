import { IndexerService } from '@services/platform/indexer.service';
import { CreateProposalModalComponent } from '@components/modals-module/create-proposal-modal/create-proposal-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { VaultCertificate } from '@models/platform/vault-certificate';
import { UserContextService } from '@services/utility/user-context.service';
import { Token } from '@models/platform/token';
import { TokenService } from '@services/platform/token.service';
import { VaultService } from '@services/platform/vault.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, switchMap, tap } from 'rxjs';
import { Vault } from '@models/platform/vault';
import { Icons } from '@enums/icons';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { HelpInfo } from '@components/shared-module/help-button/help-button.component';
import { UserContext } from '@models/user-context';
import { IPagination } from '@interfaces/database.interface';

export class StatCardInfo {
  daily?: boolean;
  title: string;
  value: FixedDecimal;
  prefix?: string;
  suffix?: string;
  change?: FixedDecimal = FixedDecimal.Zero(8);
  helpInfo?: HelpInfo;
  show?: boolean;
  icon?: Icons;
  iconColor?: string;
}

@Component({
  selector: 'opdex-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.scss']
})
export class VaultComponent implements OnInit, OnDestroy {
  vault: Vault;
  token: Token;
  certificates: VaultCertificate[];
  statCards: StatCardInfo[];
  context: UserContext;
  latestBlock: number;
  icons = Icons;
  subscription = new Subscription();
  skipCertificates = 0;
  takeCertificates = 4;
  previousCertificate: boolean;
  nextCertificate: boolean;

  constructor(
    private _indexerService: IndexerService,
    private _vaultService: VaultService,
    private _tokenService: TokenService,
    private _userContextService: UserContextService,
    public dialog: MatDialog
  ) {
    this.statCards = this._getStatCards(null, null);
  }

  ngOnInit(): void {
    this.subscription.add(this._userContextService.context$.subscribe(context => this.context = context));

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          tap(latestBlock => this.latestBlock = latestBlock),
          switchMap(_ => this._vaultService.getVault()),
          tap(vault => this.vault = vault),
          switchMap(vault => this._tokenService.buildToken(vault.token)),
          tap(token => this.token = token),
          switchMap(_ => this._getCertificates(this.skipCertificates, this.takeCertificates)))
        .subscribe(_ => {
          this.statCards = this._getStatCards(this.vault, this.token);
        })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  statCardTrackBy(index: number, statCard: StatCardInfo): string {
    return `${index}-${statCard?.title}-${statCard?.value?.formattedValue}`;
  }

  certificatesTrackBy(index: number, certificate: VaultCertificate): string {
    return `${index}-${certificate?.trackBy}`;
  }

  createProposal(): void {
    this.dialog.open(CreateProposalModalComponent, { width: '500px' });
  }

  async pageChange(isNext: boolean): Promise<void> {
    this.skipCertificates = isNext
      ? this.skipCertificates + this.takeCertificates
      : this.skipCertificates - this.takeCertificates;

    await this._getCertificates(this.skipCertificates, this.takeCertificates)
  }

  private async _getCertificates(skip: number, take: number): Promise<IPagination<VaultCertificate>> {
    const result = await this._vaultService.getCertificates(skip, take)
    this.certificates = result.results;
    this.previousCertificate = this.skipCertificates > 0 && result.count > this.skipCertificates;
    this.nextCertificate = result.count > this.takeCertificates + this.skipCertificates;
    return result;
  }

  private _getStatCards(vault: Vault, token: Token): StatCardInfo[] {
    return  [
      {
        title: 'Locked',
        value: vault?.tokensLocked,
        suffix: token?.symbol,
        icon: Icons.lock,
        iconColor: 'red',
        helpInfo: {
          title: 'Locked Tokens',
          paragraph: 'Locked tokens refers to the total number of tokens locked within the vault smart contract. As certificates are redeemed and tokens are collected, the supply will be reduced accordingly.'
        },
        show: true
      },
      {
        title: 'Unassigned',
        value: vault?.tokensUnassigned,
        suffix: token?.symbol,
        icon: Icons.tokens,
        iconColor: 'green',
        helpInfo: {
          title: 'Unassigned Tokens',
          paragraph: 'Unassigned tokens are tokens not currently assigned to certificates. The number of unassigned tokens changes as certificates are created or revoked.'
        },
        show: true
      },
      {
        title: 'Pledge Minimum',
        value: vault?.totalPledgeMinimum,
        suffix: 'CRS',
        icon: Icons.pledge,
        iconColor: 'blue',
        helpInfo: {
          title: 'Proposal Pledge Minimum',
          paragraph: 'The minimum number of CRS tokens required to collectively have pledged to move a proposal into the voting stage.'
        },
        show: true
      },
      {
        title: 'Vote Minimum',
        value: vault?.totalVoteMinimum,
        suffix: 'CRS',
        icon: Icons.proposal,
        iconColor: 'purple',
        helpInfo: {
          title: 'Proposal Vote Minimum',
          paragraph: 'The minimum number of CRS tokens required to collectively have voted on a proposal to have it measured for approval or denial.'
        },
        show: true
      }
    ]
  }
}
