import { FixedDecimal } from '@models/types/fixed-decimal';

export interface ICurrenciesResponse {
  stratis: ICurrencyPricing;
}

export interface ICurrencyPricing {
  usd: number;
  eur: number;
  gbp: number;
  jpy: number;
  cny: number;
}

export interface IPriceHistory {
  unixMilliseconds: number;
  date: Date;
  price: FixedDecimal;
}
