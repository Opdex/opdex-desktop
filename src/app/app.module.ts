import { TransactionModule } from './components/tx-module/tx.module';
import { TablesModule } from './components/tables-module/tables.module';
import { TxFeedModule } from './components/tx-feed-module/tx-feed.module';
import { EnvironmentsService } from '@services/utility/environments.service';
import { NavigationModule } from './components/navigation-module/navigation.module';
import { SharedModule } from '@components/shared-module/shared.module';
import { ModalsModule } from '@components/modals-module/modals.module';
import { CardsModule } from './components/cards-module/cards.module';
import { SharedPipesModule } from './pipes/shared-pipes.module';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ErrorMiddlewareService } from '@services/middleware/error-middleware.service';
import { initEnvironment } from '@services/init-environment.service';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { PoolsComponent } from './views/pools/pools.component';
import { TokensComponent } from './views/tokens/tokens.component';
import { MiningComponent } from './views/mining/mining.component';
import { VaultComponent } from './views/vault/vault.component';
import { PoolComponent } from './views/pool/pool.component';
import { TokenComponent } from './views/token/token.component';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TradeComponent } from './views/trade/trade.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    PoolsComponent,
    TokensComponent,
    MiningComponent,
    VaultComponent,
    PoolComponent,
    TokenComponent,
    TradeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    SharedPipesModule,
    CardsModule,
    SharedModule,
    NavigationModule,
    ModalsModule,
    TxFeedModule,
    MatSelectModule,
    TablesModule,
    TransactionModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initEnvironment,
      deps: [ EnvironmentsService ],
      multi: true
    },
    { provide: ErrorHandler, useClass: ErrorMiddlewareService },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
