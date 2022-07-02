export enum MarketMethods {
  // Base Market
  GetPool = 'GetPool',
  CreatePool = 'CreatePool',

  // Standard Market
  IsAuthorized = 'IsAuthorized',
  Authorize = 'Authorize',
  SetPendingOwnership = 'SetPendingOwnership',
  ClaimPendingOwnership = 'ClaimPendingOwnership',
  CollectMarketFees = 'CollectMarketFees'
}
