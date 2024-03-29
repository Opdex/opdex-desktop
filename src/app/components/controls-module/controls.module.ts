// Angular Core Imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Imports
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Opdex Component Imports
import { DeadlineComponent } from './deadline/deadline.component';
import { InputControlComponent } from './input-control/input-control.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ToleranceComponent } from './tolerance/tolerance.component';
import { TokenKeywordFilterControlComponent } from './token-keyword-filter-control/token-keyword-filter-control.component';
import { SharedModule } from '@components/shared-module/shared.module';
import { LiquidityPoolKeywordFilterControlComponent } from './liquidity-pool-keyword-filter-control/liquidity-pool-keyword-filter-control.component';

@NgModule({
  declarations: [
    DeadlineComponent,
    InputControlComponent,
    ToleranceComponent,
    TokenKeywordFilterControlComponent,
    LiquidityPoolKeywordFilterControlComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
    SharedModule
  ],
  exports: [
    DeadlineComponent,
    InputControlComponent,
    ToleranceComponent,
    TokenKeywordFilterControlComponent,
    LiquidityPoolKeywordFilterControlComponent
  ]
})
export class ControlsModule { }
