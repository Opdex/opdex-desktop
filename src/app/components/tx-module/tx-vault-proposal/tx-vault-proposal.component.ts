import { Component, OnChanges, Input } from '@angular/core';
import { VaultProposal } from '@models/platform/vault-proposal';

@Component({
  selector: 'opdex-tx-vault-proposal',
  templateUrl: './tx-vault-proposal.component.html',
  styleUrls: ['./tx-vault-proposal.component.scss']
})
export class TxVaultProposalComponent implements OnChanges {
  @Input() data: any;
  child: number = 1;
  txOptions = [
    { action: 'Pledge', value: 1 },
    { action: 'Vote', value: 2 },
  ];

  ngOnChanges() {
    this.child = this.txOptions.find(o => o.action.toLowerCase() == this.data?.childView?.toLowerCase())?.value || 1;
  }

  handleProposalChange($event: VaultProposal) {
    if (!this.data) {
      this.data = { proposal: $event }
    } else {
      this.data.proposal = $event;
    }
  }
}
