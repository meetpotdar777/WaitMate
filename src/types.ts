export interface PricePoint {
  date: string;
  price: number;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export interface Tracker {
  id: string;
  url: string;
  name: string;
  targetPrice?: number;
  currentPrice: number;
  lastChecked: string;
  status: 'monitoring' | 'available' | 'price-dropped';
  priceHistory: PricePoint[];
  recommendation: 'buy' | 'wait' | 'unknown';
  insight?: string;
  category: 'flight' | 'product' | 'hotel' | 'event';
  createdAt: string;
}
