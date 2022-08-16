import { EnvironmentsService } from '@services/utility/environments.service';
import { UserContext } from '@models/user-context';
import { Subscription } from 'rxjs';
import { UserContextService } from '@services/utility/user-context.service';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'opdex-terms-modal',
  templateUrl: './terms-modal.component.html',
  styleUrls: ['./terms-modal.component.scss']
})
export class TermsModalComponent implements OnInit, OnDestroy {
  context: UserContext;
  subscription = new Subscription();

  constructor(
    private _userContextService: UserContextService,
    private _env: EnvironmentsService,
    public dialogRef: MatDialogRef<TermsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  close(agree: boolean): void {
    const walletAddress = this.context.wallet.address || this.data?.walletAddress;

    if (walletAddress && agree) {
      const data = {
        acceptedDate: new Date(),
        acceptedVersion: this._env.version.raw
      };

      this._userContextService.setTermsAcceptance(walletAddress, data);
    }

    this.dialogRef.close(agree);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
