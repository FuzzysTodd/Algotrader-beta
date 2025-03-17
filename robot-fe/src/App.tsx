import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AddTradeDialog from './components/AddTradeDialog';
import TradeHistory from './components/TradeHistory';
import MetricsSummary from './components/MetricsSummary';
import { Trade, TradeFormData } from './types';

// Sample historical trades
const SAMPLE_TRADES: Trade[] = [
  {
    id: '1',
    currencyPair: 'EUR/USD',
    pricingGap: 0.025,
    entryPrice: 1.0876,
    timestamp: new Date('2024-02-15T10:30:00'),
    status: 'closed',
    profitLoss: 156.23,
    algorithm: 'MACD Crossover v1.0',
    confidence: 87,
  },
  {
    id: '2',
    currencyPair: 'GBP/USD',
    pricingGap: 0.018,
    entryPrice: 1.2654,
    timestamp: new Date('2024-02-15T14:45:00'),
    status: 'closed',
    profitLoss: -42.18,
    algorithm: 'Neural Net Alpha',
    confidence: 92,
  },
  {
    id: '3',
    currencyPair: 'USD/JPY',
    pricingGap: 0.031,
    entryPrice: 115.432,
    timestamp: new Date('2024-02-16T09:15:00'),
    status: 'open',
    profitLoss: 78.45,
    algorithm: 'Fibonacci Retrace 95',
    confidence: 85,
  },
  {
    id: '4',
    currencyPair: 'AUD/USD',
    pricingGap: 0.022,
    entryPrice: 0.7123,
    timestamp: new Date('2024-02-16T11:20:00'),
    status: 'open',
    profitLoss: 25.67,
    algorithm: 'RSI Momentum v2.1',
    confidence: 78,
  },
];

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>(SAMPLE_TRADES);

  const handleAddTrade = (formData: TradeFormData) => {
    const newTrade: Trade = {
      id: Date.now().toString(),
      currencyPair: formData.currencyPair,
      pricingGap: formData.pricingGap,
      entryPrice: Math.random() * 1000 + 500,
      timestamp: new Date(),
      status: 'open',
      profitLoss: Math.random() * 200 - 100,
      algorithm: formData.algorithm,
      confidence: Math.floor(Math.random() * 20) + 75, // 75-95% confidence
    };

    setTrades([newTrade, ...trades]);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">FOREX TRADING TERMINAL v1.0</h1>
            <p className="text-green-300">©1995 AlgoTrader Pro</p>
          </div>
          <button
            className="retro-button"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="inline-block mr-2" size={16} />
            NEW TRADE
          </button>
        </div>

        <MetricsSummary trades={trades} />
        <TradeHistory trades={trades} />

        <AddTradeDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleAddTrade}
        />
      </div>
    </div>
  );
}

export default App;