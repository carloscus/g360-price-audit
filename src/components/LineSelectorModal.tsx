import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from "../store/useAppStore";
import type { IProducto } from "../interfaces";
import { ModuleType } from '../enums';
import { Modal, Select, SearchInput, Button } from './ui';
import { DataTable, type IColumn } from './DataTable';
import { normalize } from '../utils/normalize';
import { APP_LOCALE } from '../utils/config';
import { Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

import type { State } from "../store/useAppStore";

type LineSelectorModalTriggerProps = {
  moduloKey: keyof State['listas'];
  showStockRef?: boolean;
  buttonClassName?: string;
  onConfirm?: (added: IProducto[], skipped: IProducto[]) => void;
};

/**
 * Componente Trigger + Modal para selección por línea mejorado.
 */
export function LineSelectorModalTrigger({
  moduloKey,
  showStockRef = false,
  buttonClassName,
  onConfirm,
}: LineSelectorModalTriggerProps) {
  const [open, setOpen] = useState(false);

  const module = ModuleType.COMPARADOR;

  return (
    <>
      <Button
        module={module}
        variant="outline"
        onClick={() => setOpen(true)}
        className={buttonClassName}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Elegir línea
      </Button>

      <LineSelectorModal
        isOpen={open}
        moduloKey={moduloKey}
        module={module}
        showStockRef={showStockRef}
        onClose={() => setOpen(false)}
        onConfirm={(added, skipped) => {
          onConfirm?.(added, skipped);
          setOpen(false);
        }}
      />
    </>
  );
}

type LineSelectorModalProps = {
  isOpen: boolean;
  moduloKey: keyof State['listas'];
  module: ModuleType;
  showStockRef: boolean;
  onClose: () => void;
  onConfirm: (added: IProducto[], skipped: IProducto[]) => void;
};

function getUniqueSortedLineas(productos: IProducto[]): string[] {
  const set = new Set<string>();
  for (const p of productos) {
    const linea = (p.linea ?? "").toString().trim();
    if (linea) set.add(linea);
  }
  const collator = new Intl.Collator(APP_LOCALE);
  return Array.from(set).sort((a, b) => collator.compare(a, b));
}

function sortByCodigoAsc(productos: IProducto[]): IProducto[] {
  const collator = new Intl.Collator(APP_LOCALE, { numeric: true, sensitivity: "base" });
  return [...productos].sort((a, b) =>
    collator.compare(String(a.codigo ?? ""), String(b.codigo ?? ""))
  );
}

/**
 * Skeleton loader para la tabla de productos
 */
function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {/* Header skeleton */}
      <div className="flex gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="w-5 h-4 rounded" style={{ backgroundColor: 'var(--border-primary)' }}></div>
        <div className="w-20 h-4 rounded" style={{ backgroundColor: 'var(--border-primary)' }}></div>
        <div className="flex-1 h-4 rounded" style={{ backgroundColor: 'var(--border-primary)' }}></div>
      </div>
      {/* Row skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="w-5 h-4 rounded" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-20 h-4 rounded" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="flex-1 h-4 rounded" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state atractivo con icono y orientación
 */
function EmptyState({ hasLinea, searchFilter }: { hasLinea: boolean; searchFilter: boolean }) {
  if (!hasLinea) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-primary-50)', border: '2px dashed var(--color-primary-200)' }}
        >
          <Package className="w-8 h-8" style={{ color: 'var(--color-primary-400)' }} />
        </div>
        <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Selecciona una línea
        </h4>
        <p className="text-xs max-w-[260px]" style={{ color: 'var(--text-tertiary)' }}>
          Elige una línea de productos del dropdown superior para ver los productos disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-warning-50)', border: '2px dashed var(--color-warning-200)' }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-warning-400)' }} />
      </div>
      <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {searchFilter ? 'Sin resultados' : 'Sin productos'}
      </h4>
      <p className="text-xs max-w-[260px]" style={{ color: 'var(--text-tertiary)' }}>
        {searchFilter 
          ? 'No se encontraron productos con ese nombre dentro de la línea seleccionada.'
          : 'No hay productos disponibles en esta línea.'
        }
      </p>
    </div>
  );
}

/**
 * Modal de selección por línea mejorado con componentes modulares.
 */
function LineSelectorModal({
  isOpen,
  moduloKey,
  module,
  showStockRef,
  onClose,
  onConfirm
}: LineSelectorModalProps) {
  // Store
  const catalogo = useAppStore((s) => s.catalogo);
  
  const error = useAppStore((s) => s.error);
  const agregarProductoToLista = useAppStore((s) => s.agregarProductoToLista);
  const listas = useAppStore((s) => s.listas);
  const lista = listas[moduloKey];

  // Estados del modal
  const [selectedLinea, setSelectedLinea] = useState<string>('');
  const [searchNombre, setSearchNombre] = useState('');
  const [selectedCodigos, setSelectedCodigos] = useState<Set<string | number>>(new Set());
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

// Reset states when modal opens/closes
   useEffect(() => {
     if (isOpen) {
       // eslint-disable-next-line react-hooks/exhaustive-deps
       setSelectedLinea('');
       setSearchNombre('');
       setSelectedCodigos(new Set());
       setIsLoadingProducts(false);
     }
   }, [isOpen]);

  const lineas = useMemo(() => (catalogo ? getUniqueSortedLineas(catalogo) : []), [catalogo]);

  // Simular loading al cambiar de línea
  useEffect(() => {
    if (selectedLinea) {
      setIsLoadingProducts(true);
      const timer = setTimeout(() => setIsLoadingProducts(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedLinea]);

  const productosDeLinea = useMemo(() => {
    if (!catalogo || !selectedLinea) return [];
    const base = catalogo.filter((p) => (p.linea ?? "").toString().trim() === selectedLinea);
    const ordenados = sortByCodigoAsc(base);
    if (!searchNombre.trim()) return ordenados;
    const term = normalize(searchNombre.trim());
    return ordenados.filter((p: IProducto) => normalize(p.nombre ?? "").includes(term));
  }, [catalogo, selectedLinea, searchNombre]);

  // Total de productos en la línea (sin filtro de búsqueda)
  const totalProductosLinea = useMemo(() => {
    if (!catalogo || !selectedLinea) return 0;
    return catalogo.filter((p) => (p.linea ?? "").toString().trim() === selectedLinea).length;
  }, [catalogo, selectedLinea]);

  const toggleSelection = useCallback((codigo: string | number) => {
    setSelectedCodigos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codigo)) {
        newSet.delete(codigo);
      } else {
        newSet.add(codigo);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedCodigos(prev => {
      if (prev.size === productosDeLinea.length) {
        return new Set();
      }
      return new Set(productosDeLinea.map(p => p.codigo));
    });
  }, [productosDeLinea]);

  // Determinar si el botón debe estar deshabilitado
  const isConfirmDisabled = !selectedLinea || selectedCodigos.size === 0;
  const confirmTooltip = useMemo(() => {
    if (!selectedLinea) return 'Primero selecciona una línea de productos';
    if (selectedCodigos.size === 0) return 'Selecciona al menos un producto de la tabla';
    return '';
  }, [selectedLinea, selectedCodigos.size]);

  // Configuración de columnas para la tabla
  const columns: IColumn<IProducto>[] = useMemo(() => {
    const baseColumns: IColumn<IProducto>[] = [
      {
        header: (
          <input
            type="checkbox"
          className="form-checkbox h-4 w-4 text-[var(--color-comparador-primary)] transition duration-150 ease-in-out"
          checked={selectedCodigos.size === productosDeLinea.length && productosDeLinea.length > 0}
          onChange={toggleSelectAll}
          aria-label="Seleccionar todos"
        />
      ),
        accessor: 'codigo',
        align: 'center',
        cellRenderer: (item: IProducto) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-[var(--color-comparador-primary)] transition duration-150 ease-in-out"
            checked={selectedCodigos.has(item.codigo)}
            onChange={() => toggleSelection(item.codigo)}
          />
        )
      },
      {
        header: 'Código',
        accessor: 'codigo',
        cellRenderer: (item: IProducto) => (
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{item.codigo}</span>
        )
      },
      {
        header: 'Nombre',
        accessor: 'nombre',
        cellRenderer: (item: IProducto) => (
          <span className="truncate max-w-xs" style={{ color: 'var(--text-secondary)' }} title={item.nombre}>
            {item.nombre}
          </span>
        )
      }
    ];

    if (showStockRef) {
      baseColumns.push({
        header: 'Stock Ref.',
        accessor: 'stock_referencial',
        align: 'right',
        cellRenderer: (item: IProducto) => (
          <div className="text-right">
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {typeof item.stock_referencial === "number" ? item.stock_referencial.toLocaleString() : "-"}
            </span>
          </div>
        )
      });
    }

    return baseColumns;
  }, [showStockRef, selectedCodigos, productosDeLinea, toggleSelectAll, toggleSelection]);

  const handleConfirm = () => {
    if (!catalogo) return;

    // Productos seleccionados por código
    const seleccionados = productosDeLinea.filter((p) =>
      selectedCodigos.has(String(p.codigo))
    );

    // Evitar duplicados comparando por código contra la lista actual del módulo
    const yaEnLista = new Set<string>((lista || []).map((p: IProducto): string => String(p.codigo)));
    const nuevos: IProducto[] = [];
    const duplicados: IProducto[] = [];

    for (const p of seleccionados) {
      const codigo = String(p.codigo);
      if (yaEnLista.has(codigo)) {
        duplicados.push(p);
      } else {
        nuevos.push(p);
      }
    }

    // Agregar solo los nuevos al store
    for (const item of nuevos) {
      agregarProductoToLista(item);
    }

    // Notificar resultado
    onConfirm(nuevos, duplicados);
  };

  // Footer con resumen de selección
  const selectionSummary = useMemo(() => {
    if (!selectedLinea) return null;
    const total = totalProductosLinea;
    const selected = selectedCodigos.size;
    const filtered = productosDeLinea.length;
    
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: selected > 0 ? 'var(--color-success-500)' : 'var(--text-tertiary)' }} />
        <span>
          <span className="font-semibold" style={{ color: selected > 0 ? 'var(--color-primary-500)' : 'var(--text-secondary)' }}>
            {selected}
          </span>
          {' '}de{' '}
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {filtered}
          </span>
          {' '}productos{searchNombre ? ` (de ${total} en la línea)` : ' seleccionados'}
        </span>
      </div>
    );
  }, [selectedLinea, selectedCodigos.size, totalProductosLinea, productosDeLinea.length, searchNombre]);

  const actions = (
    <div className="flex items-center justify-between w-full">
      {/* Resumen de selección a la izquierda */}
      <div className="flex-1 min-w-0">
        {selectionSummary}
      </div>
      
      {/* Botones a la derecha */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" module={module} onClick={onClose} className="hover:bg-[var(--bg-tertiary)]">
          Cancelar
        </Button>
        <div className="relative group">
          <Button
            module={module}
            variant="primary"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            Agregar seleccionados ({selectedCodigos.size})
          </Button>
          {/* Tooltip para botón deshabilitado */}
          {isConfirmDisabled && confirmTooltip && (
            <div 
              className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
              style={{ 
                backgroundColor: 'var(--color-secondary-800)', 
                color: 'var(--color-text-inverse)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {confirmTooltip}
              <div 
                className="absolute top-full right-4 w-2 h-2 rotate-45 -mt-1"
                style={{ backgroundColor: 'var(--color-secondary-800)' }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar productos por línea"
      size="lg"
      module={module}
      actions={actions}
    >
      <div className="space-y-5">
        {/* Paso 1: Selección de línea */}
        <div>
          <Select
            label="Línea de productos"
            value={selectedLinea}
            onChange={(e) => {
              setSelectedLinea(e.target.value);
              setSelectedCodigos(new Set()); // Reset selección
              setSearchNombre('');
            }}
            module={module}
            required
          >
            <option value="">Seleccione una línea</option>
            {lineas.map((linea) => (
              <option key={linea} value={linea}>
                {linea}
              </option>
            ))}
          </Select>
          {selectedLinea && totalProductosLinea > 0 && (
            <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {totalProductosLinea} productos disponibles en esta línea
            </p>
          )}
        </div>

        {/* Paso 2: Búsqueda y selección de productos */}
        {selectedLinea && (
          <div className="space-y-4 animate-fade-in">
            <div className="form-group">
              <label htmlFor="search-productos" className="form-label">Buscar productos</label>
              <SearchInput
                id="search-productos"
                placeholder="Buscar productos por nombre..."
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                onClear={() => setSearchNombre('')}
                module={module}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'var(--color-error-50)', border: '1px solid var(--color-error-200)' }}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-error-500)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-error-700)' }}>Error: {error}</p>
              </div>
            )}

            {/* Tabla con loading state */}
            {isLoadingProducts ? (
              <TableSkeleton />
            ) : productosDeLinea.length > 0 ? (
              <DataTable
                data={productosDeLinea}
                columns={columns}
              />
            ) : (
              <EmptyState hasLinea={true} searchFilter={!!searchNombre.trim()} />
            )}
          </div>
        )}

        {/* Empty state cuando no hay línea seleccionada */}
        {!selectedLinea && (
          <EmptyState hasLinea={false} searchFilter={false} />
        )}
      </div>
    </Modal>
  );
}

export default LineSelectorModal;