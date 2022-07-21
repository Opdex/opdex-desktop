import { UserContextService } from '@services/utility/user-context.service';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { WalletService } from '@services/platform/wallet.service';
import { Component, OnInit } from '@angular/core';
import { INodeWalletAddressModel } from '@interfaces/full-node.interface';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'opdex-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  walletList: string[];
  addressList: INodeWalletAddressModel[];

  wallet = new FormControl('', [Validators.required]);
  address = new FormControl('', [Validators.required]);

  constructor(
    private _walletService: WalletService,
    private _router: Router,
    private _userContextService: UserContextService
  ) { }

  async ngOnInit(): Promise<void> {
    this.walletList = await this._walletService.getWalletList();
  }

  public async selectWallet(event: MatSelectChange): Promise<void> {
    const addresses = await this._walletService.getWalletAddresses(event.value);
    this.address.reset();

    this.addressList = addresses
      .filter(address => address.isUsed)
      .sort((a, b) => b.amountConfirmed - a.amountConfirmed);
  }

  public login():void {
    this._userContextService.set(this.address.value);
    this._router.navigateByUrl('/')
  }
}
