import React from 'react';
import { BarChart3 } from 'lucide-react';
import { BrandRankingChart } from './BrandRankingChart';
import type { ComparisonTableRow } from '../../interfaces';

interface ComparadorDashboardSectionProps {
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  data: ComparisonTableRow[];
  competidores: string[];
}

/**
 * Sección de dashboard: KPIs de marca más barata, win rate y brecha
 * vs promedio (BrandRankingChart calcula sus propias métricas).
 */
export const ComparadorDashboardSection: React.FC<ComparadorDashboardSectionProps> = ({
  dashboardRef,
  data,
  competidores,
}) => {
  return (
    <section ref={dashboardRef} className="glass-card p-3 animate-slide-up section-tint-comparador" style={{ animationDelay: '300ms' }} aria-labelledby="dashboard-section-title">
      <h2 id="dashboard-section-title" className="sr-only">Dashboard de Comparación de Precios</h2>
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Dashboard</h3>
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-secondary)]" aria-hidden="true" />
      </div>
      <BrandRankingChart data={data} competidores={competidores} />
    </section>
  );
};
