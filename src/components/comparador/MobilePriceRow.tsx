import React, { useState } from 'react';
import type { ComparisonTableRow } from '../../interfaces';
import type { MarginProduct } from '../../store/useMarginStore';
import type { IColumn } from '../DataTable';
import { ChevronDown, ChevronUp, BarChart3, Trash2, Calculator, DollarSign } from 'lucide-react';
import { Tooltip } from '../ui';
import { PriceInput } from './PriceInput';
import { getBrandColorByPosition } from '../../utils/colorScheme';
import { DEFAULT_MY_BRAND } from '../../utils/config';

interface MobilePriceRowProps {
  item: ComparisonTableRow & Record<string, unknown>;
  columns: IColumn<ComparisonTableRow>[];
  competidores: string[];
  marginProductos: MarginProduct[];
  onPriceChange: (codigo: string, competidor: string, valor: number | null) => void;
  onCostChange: (codigo: string, valor: number | null) => void;
  onViewChart: (item: ComparisonTableRow) => void;
  onDeleteProduct: (codigo: string) => void;
  onOpenSlideOver: (item: ComparisonTableRow) => void;
}

export const MobilePriceRow: React.FC<MobilePriceRowProps> = ({
  item,
  columns,
  competidores,
  marginProductos,
  onPriceChange,
  onCostChange,
  onViewChart,
  onDeleteProduct,
  onOpenSlideOver,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mp = marginProductos.find(m => m.codigo === item.codigo);
  const baseCompetitor = competidores[0] || DEFAULT_MY_BRAND;

  const competitorColumns = columns.filter(
    c => competidores.slice(1).includes(String(c.accessor).replace('precios.', '')) 
  );

  const actionColumn = columns.find(c => c.accessor === 'accion');

  const renderCell = (col: IColumn<ComparisonTableRow>) => {
    if (col.cellRenderer) {
      return col.cellRenderer(item);
    }
    const value = item[col.accessor as keyof typeof item];
    return <span>{String(value ?? '—')}</span>;
  };

  return (
    <article className="rounded-lg border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-sm">
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs font-bold text-[var(--color-sku-accent)]">{item.codigo}</span>
            <p className="text-xs text-[var(--text-primary)] truncate leading-tight">{item.nombre}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
            aria-label={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-success)]">Costo</label>
            <PriceInput
              initialValue={mp?.costo ?? null}
              onPriceChange={(value) => onCostChange(item.codigo, value)}
              competidor="costo"
              item={item}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-warning)]">P. Tienda</label>
            <PriceInput
              initialValue={item.precios?.[baseCompetitor] ?? null}
              onPriceChange={(value) => onPriceChange(item.codigo, baseCompetitor, value)}
              competidor={baseCompetitor}
              item={item}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              {competidores.slice(1).map((comp) => (
                <th key={comp} className="px-2 py-1.5 text-center font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap" style={{ color: getBrandColorByPosition(comp, competidores) }}>
                  {comp}
                </th>
              ))}
              <th className="px-2 py-1.5 text-center w-28" />
            </tr>
          </thead>
          <tbody>
            <tr>
              {competidores.slice(1).map((comp) => {
                const col = columns.find(c => c.accessor === `precios.${comp}`);
                return (
                  <td key={comp} className="px-2 py-1.5 align-top">
                    {col && renderCell(col)}
                  </td>
                );
              })}
              <td className="px-2 py-1.5">
                <div className="flex items-center gap-1 justify-center">
                  <Tooltip content="Ver gráfico de barras" position="top">
                    <button
                      onClick={() => onViewChart(item)}
                      className="p-1.5 rounded-md hover:bg-[var(--color-comparador-primary)]/10 text-[var(--color-comparador-primary)] transition-all"
                      aria-label={`Ver gráfico de barras para ${item.nombre}`}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Analizar margen" position="top">
                    <button
                      onClick={() => onOpenSlideOver(item)}
                      className="p-1.5 rounded-md hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-all relative"
                      aria-label={`Analizar margen para ${item.nombre}`}
                    >
                      <Calculator className="h-4 w-4" />
                      {mp && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-success)] rounded-full border border-[var(--surface-elevated)]" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip content="Eliminar" position="top">
                    <button
                      onClick={() => onDeleteProduct(item.codigo)}
                      className="p-1.5 rounded-md hover:bg-[var(--color-danger)]/10 text-[var(--color-danger)] transition-all"
                      aria-label={`Eliminar ${item.nombre}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
};

export default MobilePriceRow;