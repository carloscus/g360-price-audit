import React, { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { LineSelectorModalTrigger } from '../LineSelectorModal';
import { BulkImportButton } from './BulkImportButton';
import { SearchInput } from '../ui/SearchInput';
import { SearchResultsDropdown } from '../ui';
import { Tooltip } from '../ui';
import type { IProducto } from '../../interfaces';

interface ComparadorSearchSectionProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  catalogLoading: boolean;
  searchResults: IProducto[];
  selectedIds: Set<string>;
  addedIds: Set<string>;
  isMobile: boolean;
  listaLength: number;
  formPreciosCount: number;
  onToggleSelection: (codigo: string) => void;
  onToggleSelectAll: () => void;
  onAddSelected: () => void;
  onAddManual: () => void;
  onClearAll: () => void;
}

/**
 * Sección de búsqueda y selección de productos: buscador con dropdown,
 * selector de líneas, carga masiva, alta manual y limpieza.
 */
export const ComparadorSearchSection: React.FC<ComparadorSearchSectionProps> = ({
  searchTerm,
  onSearchTermChange,
  catalogLoading,
  searchResults,
  selectedIds,
  addedIds,
  isMobile,
  listaLength,
  formPreciosCount,
  onToggleSelection,
  onToggleSelectAll,
  onAddSelected,
  onAddManual,
  onClearAll,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="glass-card p-3 sm:p-4 animate-slide-up section-tint-comparador" style={{ animationDelay: '200ms' }} aria-labelledby="search-section-title">
      <h2 id="search-section-title" className="sr-only">Búsqueda y Selección de Productos</h2>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2 sm:gap-3">
        <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Búsqueda y Selección</h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" role="group" aria-label="Acciones de producto">
          <LineSelectorModalTrigger
            moduloKey="precios"
            buttonClassName="text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial flex items-center justify-center hover:bg-[var(--color-primary-500)] hover:text-white hover:border-[var(--color-primary-500)] transition-all"
          />
          {/* Carga masiva solo en desktop: en campo se captura directo (búsqueda, líneas, alta manual) */}
          {!isMobile && <BulkImportButton />}
          <Tooltip content="Añadir producto manualmente si no se encuentra en la búsqueda" position="top">
            <button onClick={onAddManual} disabled={!searchTerm || searchResults.length > 0} className="btn btn-primary text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial" aria-label="Añadir producto manualmente">
              Añadir Manualmente
            </button>
          </Tooltip>
          <Tooltip content="Limpiar formulario y lista de productos" position="top">
            <button onClick={onClearAll} disabled={listaLength === 0 && formPreciosCount === 0} className="btn btn-danger text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial flex items-center justify-center gap-2" aria-label="Limpiar formulario y lista de productos" aria-describedby="clear-instruction">
              <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" aria-hidden="true" /><span>Limpiar</span></span>
            </button>
          </Tooltip>
          <div id="clear-instruction" className="sr-only">Presione para limpiar todos los datos del formulario y la lista de productos. Esta acción no se puede deshacer.</div>
        </div>
      </div>

      <div className="relative z-[60]" role="search" aria-label="Búsqueda global de productos">
        <SearchInput
          ref={searchInputRef}
          placeholder="Buscar producto por código, EAN o nombre..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onClear={() => onSearchTermChange('')}
          loading={catalogLoading}
          className="text-base sm:text-lg"
        />
        <div id="search-instruction" className="sr-only">Ingrese el código, EAN o nombre del producto para buscar.</div>
        <SearchResultsDropdown isOpen={searchResults.length > 0} results={searchResults} selectedIds={selectedIds} addedIds={addedIds} onToggleSelection={onToggleSelection} onToggleSelectAll={onToggleSelectAll} onAddSelected={onAddSelected} searchInputRef={searchInputRef} searchTerm={searchTerm} onClose={() => onSearchTermChange('')} />
      </div>
    </section>
  );
};
