import { Currencies } from "@enums/currencies";
import { FixedDecimal } from "@models/types/fixed-decimal";

export interface ICurrency {
  abbreviation: Currencies;
  htmlEntity: string;
  name: string;
  price?: FixedDecimal;
}

export const CurrencyDetailsLookup: ICurrency[] = [
  {
    abbreviation: Currencies.USD,
    htmlEntity: '&#36;',
    name: 'US Dollar'
  },
  {
    abbreviation: Currencies.GBP,
    htmlEntity: '&#163;',
    name: 'British Pound'
  },
  {
    abbreviation: Currencies.EUR,
    htmlEntity: '&#8364;',
    name: 'Euro'
  },
  {
    abbreviation: Currencies.KRW,
    htmlEntity: '&#8361;',
    name: 'Korean Won'
  }
]
