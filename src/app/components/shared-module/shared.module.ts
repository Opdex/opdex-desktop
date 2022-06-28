import { SharedPipesModule } from '@pipes/shared-pipes.module';

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

// Opdex Component Imports
import { CopyAddressComponent } from './copy-address/copy-address.component';
// import { TokenIconComponent } from './token-icon/token-icon.component';
// import { TokenIconsComponent } from './token-icons/token-icons.component';
import { NumberComponent } from './number/number.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';

// Other Imports


@NgModule({
  declarations: [
    CopyAddressComponent,
    // TokenIconComponent,
    // TokenIconsComponent,
    NumberComponent,
    ThemeToggleComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    ClipboardModule,
    SharedPipesModule
  ],
  exports: [
    MatIconModule,
    MatButtonModule,
    CopyAddressComponent,
    // TokenIconComponent,
    // TokenIconsComponent,
    NumberComponent,
    ThemeToggleComponent
  ]
})
export class SharedModule { }