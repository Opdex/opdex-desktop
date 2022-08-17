import { IndexerService } from '@services/platform/indexer.service';
import { Component, OnChanges, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { FormGroup, FormControl, FormBuilder, Validators } from "@angular/forms";
import { Icons } from "@enums/icons";
import { VaultProposal } from "@models/platform/vault-proposal";
import { VaultService } from "@services/platform/vault.service";
import { Subscription, tap, switchMap, debounceTime, distinctUntilChanged } from "rxjs";


@Component({
  selector: 'opdex-vault-proposal-selector',
  templateUrl: './vault-proposal-selector.component.html',
  styleUrls: ['./vault-proposal-selector.component.scss']
})
export class VaultProposalSelectorComponent implements OnChanges, OnDestroy {
  @Input() data: any;
  @Output() onProposalChange = new EventEmitter<VaultProposal>();

  form: FormGroup;
  proposal: VaultProposal;
  latestBlock: number;
  error: string;
  searching: boolean;
  icons = Icons;
  subscription = new Subscription();

  get proposalId(): FormControl {
    return this.form.get('proposalId') as FormControl;
  }

  constructor(
    private _fb: FormBuilder,
    private _vaultService: VaultService,
    private _indexerService: IndexerService
  ) {
    this.form = this._fb.group({
      proposalId: [undefined, [Validators.required, Validators.min(1)]],
    });

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          switchMap(_ => this._getProposal()))
        .subscribe());

    this.subscription.add(
      this.proposalId.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap(proposalId => this._getProposal(proposalId)))
        .subscribe());
  }

  ngOnChanges(): void {
    if (!!this.data) {
      const { proposal, proposalId } = this.data;
      let id = proposal?.proposalId || proposalId;

      if (id) this.proposalId.setValue(id);
    }
  }

  private async _getProposal(id?: number): Promise<VaultProposal> {
    this.searching = true;
    const proposalId = id || this.proposal?.proposalId || this.proposalId.value;

    if (!proposalId) {
      this._setProposal(undefined);
      return undefined;
    };

    try {
      const proposal = await this._vaultService.getProposal(parseInt(proposalId.toString()))
      if (!!proposal) this.error = undefined;
      this._setProposal(proposal);
      return proposal;
    } catch (error) {
      this.error = "Invalid proposal number";
      this._setProposal(undefined);
      return undefined;
    }
  }

  private _setProposal(proposal: VaultProposal) {
    this.proposal = proposal;
    this.onProposalChange.emit(this.proposal);
    this.searching = false;
  }

  handleClose(): void {
    this._setProposal(undefined);
    this.proposalId.setValue(undefined);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
