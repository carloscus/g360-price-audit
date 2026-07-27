import React, { useMemo } from 'react';
import { Trophy, Target, BarChart3, Award } from 'lucide-react';
import { getBrandColorByPosition } from '../../utils/colorScheme';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { KPICard } from '../ui/KPICard';

interface BrandRankingItem {
  codigo: string;
  nombre: string;
  precios?: Record<string, number | null>;
  rank?: number | null;
  [key: string]: unknown;
}

interface BrandRankingChartProps {
  data: BrandRankingItem[];
  competidores: string[];
}

export const BrandRankingChart: React.FC<BrandRankingChartProps> = ({
  data,
  competidores,
}) => {
  const avgPrices = useMemo(() => {
    return competidores.map(brand => {
      const prices = data
        .map(p => p.precios?.[brand] ?? 0)
        .filter(price => price > 0);
      const avg = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
      return { brand, avg };
    }).filter(b => b.avg > 0);
  }, [data, competidores]);

  const winRatePerBrand = useMemo(() => {
    const wins: { [brand: string]: { wins: number; total: number } } = {};
    competidores.forEach(brand => { wins[brand] = { wins: 0, total: 0 }; });
    data.forEach(item => {
      const prices = competidores
        .map(c => ({ brand: c, price: item.precios?.[c] ?? 0 }))
        .filter(p => p.price > 0)
        .sort((a, b) => a.price - b.price);
      if (prices.length > 0) { const winner = prices[0].brand; wins[winner].wins += 1; }
      competidores.forEach(brand => { if (item.precios?.[brand] && item.precios[brand] > 0) { wins[brand].total += 1; } });
    });
    return competidores.map(brand => ({
      brand, wins: wins[brand].wins, total: wins[brand].total,
      rate: wins[brand].total > 0 ? (wins[brand].wins / wins[brand].total) * 100 : 0,
    }));
  }, [data, competidores]);

  const overallAvg = useMemo(() => {
    const allPrices = data
      .flatMap(p => Object.values(p.precios ?? {}))
      .filter((price): price is number => typeof price === 'number' && price > 0);
    return allPrices.length > 0 ? allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length : 0;
  }, [data]);

  const myAvg = avgPrices.find(b => b.brand === competidores[0])?.avg ?? 0;
  const avgGap = overallAvg > 0 ? ((myAvg - overallAvg) / overallAvg) * 100 : 0;
  const myWinRate = winRatePerBrand.find(b => b.brand === competidores[0])?.rate ?? 0;

  const winnerBrand = avgPrices.length > 0 ? avgPrices.reduce((min, b) => b.avg < min.avg ? b : min, avgPrices[0]) : null;

  const chartData = winRatePerBrand.map(item => {
    const isWinner = winnerBrand && item.brand === winnerBrand.brand;
    const color = getBrandColorByPosition(item.brand, competidores);
    return {
      brand: item.brand === competidores[0] ? 'MI' : item.brand,
      rate: item.rate,
      fill: isWinner ? 'var(--color-success-500)' : color,
    };
  }).sort((a, b) => b.rate - a.rate);

  const heroColor = myWinRate >= 50 ? 'success' : myWinRate >= 30 ? 'danger' : 'danger';

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <KPICard
          icon={<Trophy className="w-5 h-5" />}
          label="Marca Más Barata"
          value={winnerBrand ? winnerBrand.brand === competidores[0] ? 'MI (Tu marca)' : winnerBrand.brand : 'N/A'}
          color="primary"
          size="lg"
        />
        <KPICard
          icon={<Award className="w-5 h-5" />}
          label="Win Rate"
          value={`${myWinRate.toFixed(0)}%`}
          subValue={myWinRate >= 50 ? 'Posición favorable' : myWinRate >= 30 ? 'Posición media' : 'Posición desfavorable'}
          color={heroColor}
          size="lg"
          highlight
        />
        <KPICard
          icon={<Target className="w-5 h-5" />}
          label="Brecha vs Promedio"
          value={avgGap !== 0 ? `${avgGap > 0 ? '+' : ''}${avgGap.toFixed(1)}%` : '0%'}
          subValue={avgGap < 0 ? 'Precio competitivo' : avgGap > 0 ? 'Sobre el promedio' : 'En el promedio'}
          color={avgGap < 0 ? 'success' : avgGap > 0 ? 'danger' : 'neutral'}
          size="lg"
        />
      </div>

      <div className="border-t border-[var(--border-primary)] pt-4">
        <h4 className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-[var(--text-tertiary)]" />
          Win Rate por Marca
        </h4>
        {chartData.length > 0 && (
          <div className="h-40 sm:h-48 md:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="brand" tick={{ fontSize: 12, fontWeight: 500 }} width={50} />
                <Tooltip
                  contentStyle={{
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandRankingChart;