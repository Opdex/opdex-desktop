import { VaultService } from '@services/platform/vault.service';
import { CreateProposalModalComponent } from '@components/modals-module/create-proposal-modal/create-proposal-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { NodeService } from '@services/platform/node.service';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { Icons } from 'src/app/enums/icons';
import { VaultCertificate } from '@models/platform/vault-certificate';
import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';

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
    return this.context?.wallet?.address === this.cert.owner && !this.cert.redeemed && this.vested;
  }

  public get showRevocation(): boolean {
    return this.context?.wallet && !this.vested && !this.cert.revoked
  }

  constructor(
    private _nodeService: NodeService,
    private _userContextService: UserContextService,
    private _dialog: MatDialog,
    private _vaultService: VaultService,
    private _bottomSheet: MatBottomSheet,
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

    const data = {
      childView: 'Revoke',
      form: {
        type: 2,
        recipient: this.cert.owner
      }
    }

    this._dialog.open(CreateProposalModalComponent, { width: '500px', data });
  }

  async quoteRedemption(): Promise<void> {
    if (!this.context?.wallet) return;

    const quote = await this._vaultService.redeemCertificateQuote();

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
