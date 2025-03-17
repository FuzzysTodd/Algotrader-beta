import React from 'react';
import { Trade } from '../types';

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <div className="retro-panel">
      <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-600 pb-2">TRADE HISTORY</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b-2 border-gray-600">
              <th className="py-2">PAIR</th>
              <th className="py-2">ALGORITHM</th>
              <th className="py-2">ENTRY</th>
              <th className="py-2">GAP</th>
              <th className="py-2">DATE</th>
              <th className="py-2">STATUS</th>
              <th className="py-2">CONF.</th>
              <th className="py-2">P/L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-600">
                <td className="py-2">{trade.currencyPair}</td>
                <td className="py-2">{trade.algorithm}</td>
                <td className="py-2">${trade.entryPrice.toFixed(2)}</td>
                <td className="py-2">${trade.pricingGap.toFixed(2)}</td>
                <td className="py-2">{trade.timestamp.toLocaleDateString()}</td>
                <td className="py-2">{trade.status.toUpperCase()}</td>
                <td className="py-2">{trade.confidence}%</td>
                <td className={`py-2 ${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.profitLoss ? `$${trade.profitLoss.toFixed(2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}