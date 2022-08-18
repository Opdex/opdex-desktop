import { Component, Input } from '@angular/core';
import { Icons } from 'src/app/enums/icons';

@Component({
  selector: 'opdex-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss']
})
export class CopyButtonComponent {
  @Input() color: string;
  @Input() tooltip: string;
  @Input() value: any;
  @Input() size: string;
  @Input() icon: Icons;
  @Input() stopPropagation = false;
  icons = Icons;

  copied = false;

  copyHandler(event) {
    if (this.stopPropagation) event.stopPropagation();
    this.copied = true;
    setTimeout(() => this.copied = false, 1000);
  }
}
