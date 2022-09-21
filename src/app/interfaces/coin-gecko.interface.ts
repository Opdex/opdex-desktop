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

export interface IHistoricalPricing {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
  },
  market_data: {
    current_price: {
      usd: number;
      eur: number;
      gbp: number;
      jpy: number;
      cny: number;
      sats: number;
    }
  }
}
