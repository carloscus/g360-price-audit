import React, { useState } from 'react';
import type { ComparisonTableRow } from '../../interfaces';
import { getBrandColorByPosition } from '../../utils/colorScheme';
import { useCompetitiveAnalysis } from '../../hooks/useCompetitiveAnalysis';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';
import '../../styles/print-report.css';

interface ProductAnalysisCardWithBarChartRefactorProps {
   item: ComparisonTableRow;
   competidores: string[];
   onExpand?: (item: ComparisonTableRow) => void;
   highlightedBrand?: string | null;
   onBrandHover?: (brandName: string | null) => void;
}

export const ProductAnalysisCardWithBarChartRefactor: React.FC<ProductAnalysisCardWithBarChartRefactorProps> = ({
   item,
   competidores,
   onExpand,
   highlightedBrand,
   onBrandHover,
}) => {
   const [isExpanded, setIsExpanded] = useState(true);
   const {
     myPrice,
     allPrices,
     analysis: { myPosition, bestDiff, worstDiff, validPrices },
     statistics: { min: minPrice, max: maxPrice, average: avgPrice },
     formatPercentageWithIndicator,
   } = useCompetitiveAnalysis(item, competidores);

   const avgGap = avgPrice > 0 && myPrice > 0 ? ((myPrice - avgPrice) / avgPrice) * 100 : 0;

   const priceVolatility = validPrices.length > 0
     ? ((maxPrice - minPrice) / avgPrice) * 100
     : 0;

   const maxChartValue = validPrices.length > 0 ? Math.max(...validPrices.map(p => p.value || 0)) : 1;

   const chartData = competidores.map((brandName, index) => {
     const label = index === 0 ? 'MI' : brandName;
     const priceData = allPrices.find(p => p.label.toLowerCase() === brandName.toLowerCase());

     let percentageDiff: string | undefined = undefined;
     if (index > 0) {
       const percentageKey = `% vs ${brandName}`;
       const value = item[percentageKey] as string | undefined;
       if (value) {
         percentageDiff = value;
       }
     }

     return {
       label,
       value: priceData?.value ?? null,
       originalName: brandName,
       percentage: percentageDiff,
     };
   });

  return (
    <article
       className="product-comparison-card glass border border-[var(--border-primary)] rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col print:h-auto print:shadow-none print:border-[var(--border-primary)] print:p-2 print:break-inside-avoid focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)]"
      onClick={() => onExpand?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onExpand?.(item)}
      role="button"
      tabIndex={0}
      aria-label={`Analizar producto ${item.nombre}`}
    >
      {/* Header - Nombre y Precio */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 border-b border-[var(--border-primary)]">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate leading-tight" title={item.nombre}>{item.nombre}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">SKU: {item.codigo}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
           <div className="text-sm sm:text-base font-bold font-mono px-2.5 sm:px-3 py-1 rounded-lg flex-shrink-0" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
             S/ {myPrice.toFixed(2)}
           </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors flex-shrink-0"
            aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col lg:flex-row text-sm">
          {/* Left - Gráfico de Comparación */}
          <div className="flex-1 px-3 py-2.5 sm:px-3.5 sm:py-3">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-600"></div>
              Comparativa
            </h4>
            <div className="space-y-1.5">
              {chartData.map((price, index) => {
                const widthPercentage = price.value ? (price.value / maxChartValue) * 100 : 0;
                const color = getBrandColorByPosition(price.originalName, competidores);
                const isDimmed = highlightedBrand && highlightedBrand.toLowerCase() !== price.originalName.toLowerCase();
                const isBase = index === 0;
                const isCheapest = !isBase && price.value && validPrices.length > 1 && price.value === Math.min(...validPrices.filter(p => p.label.toLowerCase() !== competidores[0].toLowerCase()).map(p => p.value || 0));

                return (
                  <div
                    key={index}
                    className={`glass-bar-container group/bar transition-opacity duration-200 ${isDimmed ? 'opacity-40' : ''}`}
                    onMouseEnter={() => onBrandHover?.(price.originalName)}
                    onMouseLeave={() => onBrandHover?.(null)}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-semibold truncate ${isBase ? 'text-blue-700 dark:text-blue-400' : isCheapest ? 'text-[var(--color-on-surface-success)]' : 'text-[var(--text-secondary)]'}`}>
                        {price.label}
                        {isBase && <span className="ml-0.5 text-[10px] font-normal opacity-70">(tu)</span>}
                      </span>
                      <span className="font-mono font-bold text-[var(--text-primary)] ml-1.5 text-xs">
                        {price.value ? `S/ ${price.value.toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="relative h-5 sm:h-5.5 bg-[var(--bg-tertiary)]/50 rounded-md overflow-hidden border border-[var(--border-secondary)]/30">
                      <div
                        className="h-full rounded-md transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(widthPercentage, 10)}%`,
                          backgroundColor: color,
                        }}
                      />
                      {price.percentage && (
                        <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold px-1 py-0.5 rounded shadow-sm whitespace-nowrap ${parseFloat(price.percentage) < 0 ? 'bg-[var(--color-success-500)] text-[var(--color-text-inverse)]' : 'bg-[var(--color-error-500)] text-[var(--color-text-inverse)]'}`}>
                          {parseFloat(price.percentage) < 0 ? '▼' : '▲'}{parseFloat(price.percentage) < 0 ? Math.abs(parseFloat(price.percentage)).toFixed(2) : (parseFloat(price.percentage)).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right - KPIs Compactos */}
          <div className="flex-1 px-3 py-2.5 sm:px-3.5 sm:py-3 border-t lg:border-t-0 lg:border-l border-[var(--border-primary)] flex flex-col gap-2">
             {/* Top Row - Código, Participación, Ranking */}
             <div className="grid grid-cols-3 gap-2">
               <InfoBlock label="Código" value={item.codigo} mono compact />
               <InfoBlock label="Part." value={`${validPrices.length}/${competidores.length}`} compact />
               <InfoBlock label="Rank." variant="accent" compact>
                 <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full font-bold text-xs shadow-sm" style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-text-inverse)' }}>
                   {myPosition > 0 ? `${myPosition}°` : 'N/A'}
                 </span>
               </InfoBlock>
             </div>

            {/* Middle - Brecha vs Promedio (Compacto) */}
              <div className="rounded-md border px-2.5 py-2" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-3 h-3" style={{ color: 'var(--color-primary-500)' }} />
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Brecha</span>
              </div>
              <div className={`text-lg sm:text-xl font-bold font-mono leading-none ${avgGap < 0 ? 'text-[var(--color-on-surface-success)]' : avgGap > 0 ? 'text-[var(--color-on-surface-error)]' : 'text-[var(--text-tertiary)]'}`}>
                {avgGap < 0 ? `▼ ${Math.abs(avgGap).toFixed(2)}%` : avgGap > 0 ? `▲ +${avgGap.toFixed(2)}%` : '0.00%' }
              </div>
            </div>

            {/* Bottom Row - Volatilidad, Mejor, Peor */}
            <div className="grid grid-cols-3 gap-1.5">
              <InfoBlock label="Volat." value={`${priceVolatility.toFixed(2)}%`} mono light compact />
              <InfoBlock label="Mejor" value={bestDiff ? formatPercentageWithIndicator(bestDiff.percentage) : '-'} variant="success" compact />
              <InfoBlock label="Peor" value={worstDiff ? formatPercentageWithIndicator(worstDiff.percentage) : '-'} variant="danger" compact />
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const InfoBlock: React.FC<{
  label: string;
  value?: string | number;
  valueClassName?: string;
  children?: React.ReactNode;
  variant?: 'success' | 'danger' | 'accent' | 'neutral';
  mono?: boolean;
  light?: boolean;
  compact?: boolean;
}> = ({ label, value, valueClassName, children, variant = 'neutral', mono = false, light = false, compact = false }) => {
  const variantClasses = {
    base: compact 
      ? 'rounded-md border flex flex-col items-center justify-center text-center p-1.5 min-h-[56px] sm:min-h-[60px]'
      : 'rounded-md border flex flex-col items-center justify-center text-center p-2 sm:p-2.5 min-h-[72px] sm:min-h-[80px]',
success: 'bg-[var(--surface-elevated)] border-[var(--color-success-300)]',
  danger: 'bg-[var(--surface-elevated)] border-[var(--color-error-300)]',
    accent: 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]',
     neutral: light ? 'bg-[var(--bg-tertiary)]/60 border-[var(--border-secondary)]' : 'bg-[var(--surface-glass)] border-[var(--border-primary)]',
  };

  const textColorClass = variant === 'success' ? 'text-green-700 dark:text-green-400'
    : variant === 'danger' ? 'text-red-700 dark:text-red-400'
    : variant === 'accent' ? 'text-[var(--text-primary)]'
    : 'text-[var(--text-secondary)]';

  return (
    <div className={`${variantClasses.base} ${variantClasses[variant]}`}>
      <span className={`text-xs font-semibold uppercase tracking-wider ${textColorClass} leading-tight`}>
        {label}
      </span>
      {value !== undefined && (
        <span className={`text-xs sm:text-sm font-bold mt-1 leading-tight truncate w-full ${mono ? 'font-mono' : ''} ${textColorClass} ${valueClassName || ''}`}>
          {value}
        </span>
      )}
      {children}
    </div>
  );
};

export default ProductAnalysisCardWithBarChartRefactor;