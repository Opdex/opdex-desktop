import { NgModule } from '@angular/core';

import { FormatNumberPipe } from './format-number.pipe';
import { ShortNumberPipe } from './short-number.pipe';
import { ShortAddressPipe } from './short-address.pipe';
import { CoinNotationPipe } from './coin-notation.pipe';

@NgModule({
  declarations: [
    CoinNotationPipe,
    ShortAddressPipe,
    ShortNumberPipe,
    FormatNumberPipe
  ],
  exports: [
    CoinNotationPipe,
    ShortAddressPipe,
    ShortNumberPipe,
    FormatNumberPipe
  ]
})
export class SharedPipesModule { }
