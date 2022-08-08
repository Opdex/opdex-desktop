import { VaultService } from '@services/platform/vault.service';
import { Component, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { ReviewQuoteComponent } from "@components/tx-module/shared/review-quote/review-quote.component";
import { Icons } from "@enums/icons";
import { VaultProposal } from "@models/platform/vault-proposal";
import { UserContext } from "@models/user-context";
import { UserContextService } from "@services/utility/user-context.service";
import { Subscription } from "rxjs";


@Component({
  selector: 'opdex-vault-proposal-card',
  templateUrl: './vault-proposal-card.component.html',
  styleUrls: ['./vault-proposal-card.component.scss']
})
export class VaultProposalCardComponent implements OnDestroy {
  @Input() proposal: VaultProposal;
  @Input() latestBlock: number;
  @Output() onClose = new EventEmitter<void>();

  icons = Icons;
  context: UserContext;
  subscription = new Subscription();

  constructor(
    private _bottomSheet: MatBottomSheet,
    private _userContextService: UserContextService,
    private _vaultService: VaultService
  ) {
    this.subscription.add(this._userContextService.context$.subscribe(context => this.context = context));
  }

  getExpirationPercentage() {
    if (this.proposal.status === 'Complete' || this.proposal.expiration <= this.latestBlock) return 100;

    const threeDays = 60 * 60 * 24 * 3 / 16;
    const oneWeek = 60 * 60 * 24 * 7 / 16;
    const duration = this.proposal.status === 'Pledge' ? oneWeek : threeDays;
    const startBlock = this.proposal.expiration - duration;
    const blocksPassed = this.latestBlock - startBlock;

    return Math.floor((blocksPassed / duration) * 100);
  }

  async completeProposal(): Promise<void> {
    if (!this.context?.wallet) return;

    const quote = await this._vaultService.completeProposalQuote(this.proposal.proposalId);

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  close(): void {
    this.onClose.emit();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
