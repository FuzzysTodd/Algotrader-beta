export interface Trade {
  id: string;
  currencyPair: string;
  pricingGap: number;
  entryPrice: number;
  timestamp: Date;
  status: 'open' | 'closed';
  profitLoss?: number;
  algorithm: string;
  confidence: number;
}

export interface TradeFormData {
  currencyPair: string;
  pricingGap: number;
  algorithm: string;
}