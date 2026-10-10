import React from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { DataTable } from '../DataTable';
import { ExcelJSExportButton } from '../ExcelJSExportButton';
import { MobilePriceRow } from './MobilePriceRow';
import { Tooltip, Spinner } from '../ui';
import type { IProductoEditado, ComparisonTableRow } from '../../interfaces';
import type { IColumn } from '../DataTable';
import type { MarginProduct } from '../../store/useMarginStore';

interface ComparadorTableSectionProps {
  comparisonTableRef: React.RefObject<HTMLDivElement | null>;
  isSubmitting: boolean;
  onHtmlExport: () => void;
  onPngExportClick: () => void;
  listaLength: number;
  dataConPorcentajes: (IProductoEditado & Record<string, string | number | undefined>)[];
  sortedData: (IProductoEditado & Record<string, string | number | undefined>)[];
  columns: IColumn<ComparisonTableRow>[];
  competidores: string[];
  marginProductos: MarginProduct[];
  isMobile: boolean;
  cliente: string;
  documento?: string;
  codigo_cliente?: string;
  sucursal?: string;
  responsable: string;
  onPriceChange: (codigo: string, competidor: string, valor: number | null) => void;
  onCostChange: (codigo: string, valor: number | null) => void;
  onDeleteProduct: (codigo: string) => void;
  onViewChart: (item: ComparisonTableRow) => void;
  onOpenSlideOver: (item: ComparisonTableRow) => void;
}

/**
 * Sección de tabla de comparación: acciones de exportación (Excel/HTML/PNG),
 * tabla en desktop, cards en móvil y estado vacío.
 */
export const ComparadorTableSection: React.FC<ComparadorTableSectionProps> = ({
  comparisonTableRef,
  isSubmitting,
  onHtmlExport,
  onPngExportClick,
  listaLength,
  dataConPorcentajes,
  sortedData,
  columns,
  competidores,
  marginProductos,
  isMobile,
  cliente,
  documento,
  codigo_cliente,
  sucursal,
  responsable,
  onPriceChange,
  onCostChange,
  onDeleteProduct,
  onViewChart,
  onOpenSlideOver,
}) => {
  return (
    <section ref={comparisonTableRef} className="glass-card p-3 animate-slide-up section-tint-comparador" style={{ animationDelay: '400ms' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <h2 className="text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">Tabla de Comparación</h2>
        </div>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Acciones de exportación">
          <ExcelJSExportButton productos={dataConPorcentajes.map(p => { const mp = marginProductos.find(m => m.codigo === p.codigo); return { ...p, precios: p.precios ?? Object.fromEntries(competidores.map(m => [m, null])), costo: mp?.costo ?? null, precioTienda: mp?.precioTienda ?? null, linea: mp?.linea ?? p.linea, prop1Precio: mp?.prop1Precio ?? null, prop2Costo: mp?.prop2Costo ?? null, prop2Precio: mp?.prop2Precio ?? null, prop2CantidadMinima: mp?.prop2CantidadMinima ?? null, }; })} marcas={competidores} cliente={cliente} documento={documento} codigo_cliente={codigo_cliente} sucursal={sucursal} responsable={responsable} disabled={isSubmitting || listaLength === 0} />
          <Tooltip content="Exportar como página HTML navegable" position="top">
            <button onClick={onHtmlExport} disabled={isSubmitting || listaLength === 0} className="btn btn-primary" aria-label={isSubmitting ? "Generando HTML..." : "Exportar como HTML navegable"} aria-busy={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Spinner size={16} className="text-[var(--color-btn-primary-text)]" /><span>Generando...</span></span>
              ) : (
                <span className="flex items-center gap-2"><Download className="w-5 h-5" aria-hidden="true" /><span>Exportar HTML</span></span>
              )}
            </button>
          </Tooltip>
          <Tooltip content="Exportar tabla de comparación a PNG" position="top">
            <button onClick={onPngExportClick} disabled={isSubmitting || listaLength === 0} className="btn btn-primary" aria-label={isSubmitting ? "Generando PNG..." : "Exportar tabla de comparación a PNG"} aria-busy={isSubmitting}>
              {isSubmitting ? (
                  <span className="flex items-center gap-2"><Spinner size={16} className="text-[var(--color-btn-primary-text)]" /><span>Generando...</span></span>
              ) : (
                <span className="flex items-center gap-2"><Download className="w-5 h-5" aria-hidden="true" /><span>Exportar PNG</span></span>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {listaLength > 0 ? (
        <>
          <div className={`rounded-xl overflow-hidden border border-[var(--border-primary)] shadow-sm ${isMobile ? 'hidden' : ''}`} data-no-export>
            <DataTable data={sortedData} columns={columns} tableClassName="w-full" />
          </div>
          {isMobile && (
            <div className="space-y-3">
              {sortedData.map(item => (
                <MobilePriceRow
                  key={item.codigo}
                  item={item as ComparisonTableRow & Record<string, unknown>}
                  columns={columns}
                  competidores={competidores}
                  marginProductos={marginProductos}
                  onPriceChange={onPriceChange}
                  onCostChange={onCostChange}
                  onViewChart={onViewChart}
                  onDeleteProduct={onDeleteProduct}
                  onOpenSlideOver={onOpenSlideOver}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-[var(--border-secondary)] bg-[var(--color-comparador-surface)] animate-fade-in">
          <div className="w-14 h-14 mx-auto bg-[var(--surface-elevated)] rounded-xl flex items-center justify-center mb-4 shadow-md border border-[var(--border-primary)]">
            <BarChart3 className="h-7 w-7 text-[var(--color-comparador-primary)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Comienza a comparar</h3>
          <p className="mt-1 text-[var(--text-secondary)] max-w-md mx-auto text-sm leading-relaxed">Utiliza el buscador superior para agregar productos a la lista y comenzar el análisis de precios.</p>
        </div>
      )}
    </section>
  );
};
