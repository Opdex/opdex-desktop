import { VaultCertificate } from './../../models/platform/vault-certificate';
import { UserContextService } from '@services/utility/user-context.service';
import { Token } from '@models/platform/token';
import { TokenFactoryService } from '@services/factory/token-factory.service';
import { NodeService } from '@services/platform/node.service';
import { VaultFactoryService } from '@services/factory/vault-factory.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, switchMap, tap } from 'rxjs';
import { Vault } from '@models/platform/vault';
import { Icons } from '@enums/icons';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { HelpInfo } from '@components/shared-module/help-button/help-button.component';
import { UserContext } from '@models/user-context';

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
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _nodeService: NodeService,
    private _vaultFactory: VaultFactoryService,
    private _tokenFactory: TokenFactoryService,
    private _userContextService: UserContextService
  ) {
    this.statCards = this._getStatCards(null, null);
  }

  ngOnInit(): void {
    this.subscription.add(this._userContextService.context$.subscribe(context => this.context = context));

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(_ => this._vaultFactory.getVault()),
          tap(vault => this.vault = vault),
          switchMap(vault => this._tokenFactory.buildToken(vault.token)),
          tap(token => this.token = token),
          switchMap(_ => this._vaultFactory.getCertificates()),
          tap(certificates => this.certificates = certificates))
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
