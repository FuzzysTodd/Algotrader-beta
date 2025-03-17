import React from 'react';
import { DollarSign, TrendingUp, Wallet, Cpu, Clock } from 'lucide-react';
import { Trade } from '../types';

interface MetricsSummaryProps {
  trades: Trade[];
}

export default function MetricsSummary({ trades }: MetricsSummaryProps) {
  const totalInvested = trades.reduce((sum, trade) => sum + trade.entryPrice, 0);
  const totalProfitLoss = trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
  const successRate = trades.length > 0 
    ? (trades.filter(t => (t.profitLoss || 0) > 0).length / trades.length) * 100 
    : 0;
  const avgConfidence = trades.length > 0
    ? trades.reduce((sum, trade) => sum + trade.confidence, 0) / trades.length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="retro-panel">
        <div className="flex items-center gap-3">
          <DollarSign className="shrink-0" />
          <div>
            <div className="text-sm text-green-300">TOTAL INVESTED</div>
            <div className="text-xl font-bold">${totalInvested.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="retro-panel">
        <div className="flex items-center gap-3">
          <TrendingUp className="shrink-0" />
          <div>
            <div className="text-sm text-green-300">PROFIT/LOSS</div>
            <div className={`text-xl font-bold ${totalProfitLoss > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalProfitLoss.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="retro-panel">
        <div className="flex items-center gap-3">
          <Wallet className="shrink-0" />
          <div>
            <div className="text-sm text-green-300">SUCCESS RATE</div>
            <div className="text-xl font-bold">{successRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="retro-panel">
        <div className="flex items-center gap-3">
          <Cpu className="shrink-0" />
          <div>
            <div className="text-sm text-green-300">AVG CONFIDENCE</div>
            <div className="text-xl font-bold">{avgConfidence.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="retro-panel">
        <div className="flex items-center gap-3">
          <Clock className="shrink-0" />
          <div>
            <div className="text-sm text-green-300">UPTIME</div>
            <div className="text-xl font-bold">96.7 HRS</div>
          </div>
        </div>
      </div>
    </div>
  );
}