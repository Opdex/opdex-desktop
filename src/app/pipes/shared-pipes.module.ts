import { ContractParameterPipe } from './contract-parameter.pipe';
import { NgModule } from '@angular/core';

import { FormatNumberPipe } from './format-number.pipe';
import { ShortNumberPipe } from './short-number.pipe';
import { ShortAddressPipe } from './short-address.pipe';
import { CoinNotationPipe } from './coin-notation.pipe';
import { TimeagoModule } from 'ngx-timeago';

@NgModule({
  declarations: [
    CoinNotationPipe,
    ShortAddressPipe,
    ShortNumberPipe,
    FormatNumberPipe,
    ContractParameterPipe
  ],
  imports: [
    TimeagoModule.forRoot()
  ],
  exports: [
    CoinNotationPipe,
    ShortAddressPipe,
    ShortNumberPipe,
    FormatNumberPipe,
    TimeagoModule,
    ContractParameterPipe
  ]
})
export class SharedPipesModule { }
