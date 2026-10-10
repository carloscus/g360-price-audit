import React from 'react';
import { Package, Trophy, ListOrdered, Percent } from 'lucide-react';
import { KPICard } from '../ui/KPICard';
import { useMarginStore } from '../../store/useMarginStore';
import { calculateMargin } from '../../utils/calculationUtils';

interface ComparadorQuickMetricsProps {
  productosCount: number;
  priceWins: number;
  averageRanking: number;
  marcasCount: number;
}

/**
 * Franja de métricas básicas de vista rápida: n productos, SKUs donde la
 * marca propia es la más barata, posición promedio y margen promedio.
 * Reutiliza los KPIs ya calculados (useComparadorKPIs) y los márgenes del store.
 */
export const ComparadorQuickMetrics: React.FC<ComparadorQuickMetricsProps> = ({
  productosCount,
  priceWins,
  averageRanking,
  marcasCount,
}) => {
  const marginProductos = useMarginStore((state) => state.productos);

  const margenes = marginProductos
    .map(m => calculateMargin(m.costo, m.precioTienda))
    .filter((m): m is number => m !== null);
  const margenPromedio = margenes.length > 0
    ? margenes.reduce((a, b) => a + b, 0) / margenes.length
    : null;

  const winRate = productosCount > 0 ? (priceWins / productosCount) * 100 : 0;

  return (
    <section className="animate-slide-up" style={{ animationDelay: '150ms' }} aria-label="Métricas de vista rápida">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<Package className="w-4 h-4" />}
          label="Productos"
          value={String(productosCount)}
          subValue={`${marcasCount} marcas`}
          color="neutral"
        />
        <KPICard
          icon={<Trophy className="w-4 h-4" />}
          label="Más barato"
          value={`${priceWins} de ${productosCount}`}
          subValue={`${winRate.toFixed(1)}% win rate`}
          color="success"
        />
        <KPICard
          icon={<ListOrdered className="w-4 h-4" />}
          label="Posición promedio"
          value={averageRanking > 0 ? `${averageRanking.toFixed(1)}` : '—'}
          subValue={`de ${marcasCount} marcas`}
          color="primary"
        />
        <KPICard
          icon={<Percent className="w-4 h-4" />}
          label="Margen promedio"
          value={margenPromedio !== null ? `${margenPromedio.toFixed(1)}%` : '—'}
          subValue={margenes.length > 0 ? `${margenes.length} SKUs con costo` : 'Sin costos cargados'}
          color="info"
        />
      </div>
    </section>
  );
};
