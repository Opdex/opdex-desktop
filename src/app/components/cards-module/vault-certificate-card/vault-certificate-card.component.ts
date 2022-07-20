import { NodeService } from '@services/platform/node.service';
// import { MatBottomSheet } from '@angular/material/bottom-sheet';
// import { EnvironmentsService } from '@services/utility/environments.service';
// import { PlatformApiService } from '@services/api/platform-api.service';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { Icons } from 'src/app/enums/icons';
import { VaultCertificate } from '@models/platform/vault-certificate';
import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
// import { ReviewQuoteComponent } from '@sharedComponents/tx-module/shared/review-quote/review-quote.component';
// import { ITransactionQuote } from '@models/platform-api/responses/transactions/transaction-quote.interface';
// import { take } from 'rxjs/operators';
// import { SidenavService } from '@services/utility/sidenav.service';
// import { TransactionView } from '@models/transaction-view';

@Component({
  selector: 'opdex-vault-certificate-card',
  templateUrl: './vault-certificate-card.component.html',
  styleUrls: ['./vault-certificate-card.component.scss']
})
export class VaultCertificateCardComponent implements OnDestroy {
  @Input() cert: VaultCertificate;
  context: UserContext;
  latestBlock: number;
  icons = Icons;
  subscription = new Subscription();

  public get vested(): boolean {
    return !!this.latestBlock && !! this.cert && this.latestBlock > this.cert.vestingEndBlock;
  }

  public get showMenu(): boolean {
    return this.showRedemption || this.showRevocation;
  }

  public get showRedemption(): boolean {
    return this.context?.wallet === this.cert.owner && !this.cert.redeemed && this.vested;
  }

  public get showRevocation(): boolean {
    return this.context?.wallet && !this.vested && !this.cert.revoked
  }

  constructor(
    private _nodeService: NodeService,
    private _userContextService: UserContextService,
    // private _platformApiService: PlatformApiService,
    // private _env: EnvironmentsService,
    // private _bottomSheet: MatBottomSheet,
    // private _sidebar: SidenavService
  ) {
    this.subscription.add(
      this._nodeService.latestBlock$
        .subscribe(block => this.latestBlock = block));

    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  revokeProposal(): void {
    if (!this.context?.wallet || !this.cert) return;

    // const data = {
    //   childView: 'Revoke',
    //   form: {
    //     type: 2,
    //     recipient: this.cert.owner
    //   }
    // }

    // this._sidebar.openSidenav(TransactionView.vaultProposal, data);
  }

  quoteRedemption(): void {
    // if (!this.context?.wallet) return;

    // this._platformApiService
    //   .redeemVaultCertificate(this._env.vaultAddress)
    //     .pipe(take(1))
    //     .subscribe((quote: ITransactionQuote) => this._bottomSheet.open(ReviewQuoteComponent, { data: quote }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
