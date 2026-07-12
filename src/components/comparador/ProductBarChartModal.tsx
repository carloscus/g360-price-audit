import React, { useMemo } from 'react';
import type { ComparisonTableRow } from '../../interfaces';
import type { MarginProduct } from '../../store/useMarginStore';
import { Modal } from '../ui';
import PriceBarChart from './PriceBarChart';
import { useCompetitiveAnalysis } from '../../hooks/useCompetitiveAnalysis';
import { calculateMargin } from '../../utils/calculationUtils';
import { Target, Percent, Trophy, Medal, TrendingDown, TrendingUp } from 'lucide-react';

interface ProductBarChartModalProps {
  product: ComparisonTableRow | null;
  competidores: string[];
  marginProductos?: MarginProduct[];
  onClose: () => void;
}

const KpiBlock: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2.5 py-2">
    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</span>
    <div className="text-sm font-bold font-mono mt-0.5" style={color ? { color } : undefined}>
      {value}
    </div>
  </div>
);

export const ProductBarChartModal: React.FC<ProductBarChartModalProps> = ({ product, competidores, marginProductos, onClose }) => {
  const {
    myPrice,
    allPrices,
    analysis: { myPosition, bestDiff, worstDiff, validPrices },
    statistics: { min: minPrice, max: maxPrice, average: avgPrice },
    formatPercentageWithIndicator,
  } = useCompetitiveAnalysis(product ?? ({} as ComparisonTableRow), competidores);

  const marginProduct = product ? marginProductos?.find(m => m.codigo === product.codigo) : undefined;
  const costo = marginProduct?.costo ?? null;
  const marginPct = costo != null && myPrice > 0 ? calculateMargin(costo, myPrice) : null;
  const avgGap = avgPrice > 0 && myPrice > 0 ? ((myPrice - avgPrice) / avgPrice) * 100 : 0;
  const cheapestGap = minPrice > 0 && myPrice > 0 ? myPrice - minPrice : null;
  const priceVolatility = validPrices.length > 0 ? ((maxPrice - minPrice) / avgPrice) * 100 : 0;

  if (!product) return null;

  return (
    <Modal
      isOpen={!!product}
      onClose={onClose}
      title={`${product.nombre || ''}`}
      size="md"
    >
      <div className="space-y-4">
        <PriceBarChart
          data={competidores.map(comp => ({
            name: comp,
            value: product.precios?.[comp] ?? 0
          }))}
          aria-label={`Gráfico de barras de precios para ${product.nombre}`}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <KpiBlock
            label="Ranking"
            value={
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-text-inverse)' }}>
                <Medal className="w-3 h-3" />
                {myPosition > 0 ? `#${myPosition}` : 'N/A'}
              </span>
            }
          />
          <KpiBlock
            label="Margen"
            value={marginPct !== null ? `${marginPct.toFixed(1)}%` : '—'}
            color={marginPct !== null && marginPct >= 20 ? 'var(--color-on-surface-success)' : marginPct !== null && marginPct >= 10 ? '#d97706' : undefined}
          />
          <KpiBlock
            label="Brecha"
            value={
              <span className={avgGap < 0 ? 'text-[var(--color-on-surface-success)]' : avgGap > 0 ? 'text-[var(--color-on-surface-error)]' : ''}>
                {avgGap < 0 ? `▼ ${Math.abs(avgGap).toFixed(2)}%` : avgGap > 0 ? `▲ +${avgGap.toFixed(2)}%` : '0.00%'}
              </span>
            }
          />
          <KpiBlock
            label="Más Barato"
            value={
              cheapestGap !== null
                ? `S/ ${minPrice.toFixed(2)}${cheapestGap > 0 ? ` (+${cheapestGap.toFixed(2)})` : ''}`
                : '—'
            }
            color={cheapestGap !== null && cheapestGap <= 0 ? 'var(--color-on-surface-success)' : cheapestGap !== null ? 'var(--color-on-surface-error)' : undefined}
          />
          <KpiBlock
            label="Volatilidad"
            value={`${priceVolatility.toFixed(2)}%`}
          />
          <KpiBlock
            label="Mi Precio"
            value={`S/ ${myPrice.toFixed(2)}`}
          />
        </div>

        {(bestDiff || worstDiff) && (
          <div className="flex gap-2 text-xs">
            {bestDiff && (
              <span className="text-[var(--color-on-surface-success)] font-semibold">
                Mejor: {formatPercentageWithIndicator(bestDiff.percentage)}
              </span>
            )}
            {worstDiff && (
              <span className="text-[var(--color-on-surface-error)] font-semibold">
                Peor: {formatPercentageWithIndicator(worstDiff.percentage)}
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductBarChartModal;