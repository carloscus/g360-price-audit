import React, { useState } from 'react';
import { ProductAnalysisCard } from './ProductAnalysisCard';
import type { ComparisonTableRow } from '../../interfaces';
import type { MarginProduct } from '../../store/useMarginStore';

interface AnalisisIndividualSectionProps {
  sortedData: ComparisonTableRow[];
  competidores: string[];
  marginProductos: MarginProduct[];
  highlightedBrand: string | null;
  onBrandHover: (brandName: string | null) => void;
}

/**
 * Sección de análisis individual por producto: cards con barras de
 * comparación y selector de cantidad visible (5/10/20).
 */
export const AnalisisIndividualSection: React.FC<AnalisisIndividualSectionProps> = ({
  sortedData,
  competidores,
  marginProductos,
  highlightedBrand,
  onBrandHover,
}) => {
  const [visibleProducts, setVisibleProducts] = useState<number>(10);

  return (
    <section className="animate-slide-up" style={{ animationDelay: '500ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Análisis Individual por Producto</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Ver:</span>
          {[5, 10, 20].map((count) => (
            <button
              key={count}
              onClick={() => setVisibleProducts(count)}
              className="px-3 py-1 text-xs font-bold rounded-md border transition-all"
              style={visibleProducts === count
                ? { backgroundColor: 'var(--color-primary-500)', color: '#ffffff', borderColor: 'var(--color-primary-500)', boxShadow: '0 2px 8px rgba(26, 86, 219, 0.25)' }
                : { backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }
              }
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      <div className="product-analysis-grid-compact">
        {sortedData.slice(0, visibleProducts).map(item => {
          const costoItem = marginProductos.find(m => m.codigo === item.codigo)?.costo ?? null;
          return (
            <div key={`card-wrapper-${item.codigo}`} id={`product-card-${item.codigo}`}>
              <ProductAnalysisCard key={item.codigo} item={item} competidores={competidores} costo={costoItem} highlightedBrand={highlightedBrand} onBrandHover={onBrandHover} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
