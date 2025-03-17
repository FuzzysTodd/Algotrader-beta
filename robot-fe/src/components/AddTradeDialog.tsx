import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TradeFormData } from '../types';

const CURRENCY_PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
];

const ALGORITHMS = [
  'MACD Crossover v1.0',
  'RSI Momentum v2.1',
  'Neural Net Alpha',
  'Fibonacci Retrace 95',
  'Bollinger Bands Classic',
];

interface AddTradeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TradeFormData) => void;
}

export default function AddTradeDialog({ open, onClose, onSubmit }: AddTradeDialogProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    currencyPair: '',
    pricingGap: 0,
    algorithm: '',
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ currencyPair: '', pricingGap: 0, algorithm: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="retro-panel w-[480px] relative">
        <div className="flex justify-between items-center mb-4 border-b-2 border-gray-600 pb-2">
          <h2 className="text-xl font-bold">NEW TRADE EXECUTION</h2>
          <button onClick={onClose} className="hover:text-green-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Currency Pair:</label>
            <div className="relative">
              <select
                className="retro-select w-full"
                value={formData.currencyPair}
                onChange={(e) => setFormData({ ...formData, currencyPair: e.target.value })}
              >
                <option value="">Select Pair</option>
                {CURRENCY_PAIRS.map((pair) => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                ▼
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2">Trading Algorithm:</label>
            <div className="relative">
              <select
                className="retro-select w-full"
                value={formData.algorithm}
                onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
              >
                <option value="">Select Algorithm</option>
                {ALGORITHMS.map((algo) => (
                  <option key={algo} value={algo}>{algo}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                ▼
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2">Pricing Gap:</label>
            <input
              type="number"
              className="retro-input w-full"
              value={formData.pricingGap}
              onChange={(e) => setFormData({ ...formData, pricingGap: parseFloat(e.target.value) })}
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t-2 border-gray-600">
            <button type="button" onClick={onClose} className="retro-button">
              CANCEL
            </button>
            <button
              type="submit"
              className="retro-button bg-green-700 hover:bg-green-600"
              disabled={!formData.currencyPair || !formData.algorithm || formData.pricingGap <= 0}
            >
              EXECUTE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}