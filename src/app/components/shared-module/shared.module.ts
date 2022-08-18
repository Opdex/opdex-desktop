// Angular Core Imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// CDK Imports
import { ClipboardModule } from '@angular/cdk/clipboard';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

// Opdex Component Imports
import { CopyAddressComponent } from './copy-address/copy-address.component';
import { TokenIconComponent } from './token-icon/token-icon.component';
import { TokenIconsComponent } from './token-icons/token-icons.component';
import { NumberComponent } from './number/number.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { CurrencySelectComponent } from './currency-select/currency-select.component';
import { TokenNativeChainBadgeComponent } from './token-native-chain-badge/token-native-chain-badge.component';
import { TxQuoteSubmitButtonComponent } from './tx-quote-submit-button/tx-quote-submit-button.component';
import { HelpButtonComponent } from './help-button/help-button.component';
import { CopyButtonComponent } from './copy-button/copy-button.component';
import { SharedPipesModule } from '@pipes/shared-pipes.module';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { QrCodeModule } from 'ng-qrcode';

@NgModule({
  declarations: [
    CopyAddressComponent,
    TokenIconComponent,
    TokenIconsComponent,
    NumberComponent,
    ThemeToggleComponent,
    CurrencySelectComponent,
    TokenNativeChainBadgeComponent,
    CopyButtonComponent,
    HelpButtonComponent,
    TxQuoteSubmitButtonComponent,
    QrCodeComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    ClipboardModule,
    SharedPipesModule,
    QrCodeModule
  ],
  exports: [
    MatIconModule,
    MatButtonModule,
    CopyAddressComponent,
    TokenIconComponent,
    TokenIconsComponent,
    NumberComponent,
    ThemeToggleComponent,
    CurrencySelectComponent,
    TokenNativeChainBadgeComponent,
    CopyButtonComponent,
    HelpButtonComponent,
    TxQuoteSubmitButtonComponent,
    QrCodeComponent
  ]
})
export class SharedModule { }
