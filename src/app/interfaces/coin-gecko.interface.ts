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
