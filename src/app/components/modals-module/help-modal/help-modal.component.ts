import { HelpInfo } from '@components/shared-module/help-button/help-button.component';
import { Component, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'opdex-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss']
})
export class HelpModalComponent {
  public constructor(
    public dialogRef: MatDialogRef<HelpModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HelpInfo
  ) {}
}
