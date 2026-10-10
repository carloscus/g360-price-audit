import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IForm, FieldConfig, ComparisonTableRow } from '../interfaces';
import { calculateDataWithPercentages } from '../utils/comparisonUtils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from '../components/ui';
import { DEFAULT_MY_BRAND } from '../utils/config';
import { useComparadorKPIs } from '../hooks/useComparadorKPIs';
import { useComparadorExport } from '../hooks/useComparadorExport';
import { useComparadorColumns } from '../hooks/useComparadorColumns';
import { useMarginSlideOver } from '../hooks/useMarginSlideOver';
import { MarginSlideOver } from '../components/margen/MarginSlideOver';
import { useMarginStore } from '../store/useMarginStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { ComparadorHeader } from '../components/comparador/ComparadorHeader';
import { ComparadorSearchSection } from '../components/comparador/ComparadorSearchSection';
import { ComparadorQuickMetrics } from '../components/comparador/ComparadorQuickMetrics';
import { ComparadorTableSection } from '../components/comparador/ComparadorTableSection';
import { AnalisisIndividualSection } from '../components/comparador/AnalisisIndividualSection';
import { ComparadorDashboardSection } from '../components/comparador/ComparadorDashboardSection';
import { ProductBarChartModal } from '../components/comparador/ProductBarChartModal';

export const ComparadorPage: React.FC = () => {
  const {
    catalogo,
    cargarCatalogo,
    formState,
    agregarProductoToLista,
    actualizarProductoEnLista,
    eliminarProductoDeLista,
    loading: catalogLoading
  } = useAppStore();
  const lista = useAppStore((state) => state.listas.precios);
  const marginProductos = useMarginStore((state) => state.productos);
  const actualizarCampoMarginProducto = useMarginStore((state) => state.actualizarCampo);
  const agregarProductoConCosto = useMarginStore((state) => state.agregarProductoConCosto);
  const eliminarMarginProducto = useMarginStore((state) => state.eliminarProducto);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForChart, setSelectedProductForChart] = useState<ComparisonTableRow | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<string>>(new Set());
  const [highlightedBrand, setHighlightedBrand] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const dashboardRef = useRef<HTMLDivElement>(null);
  const exportWrapperRef = useRef<HTMLDivElement>(null);
  const comparisonTableRef = useRef<HTMLDivElement>(null);

  const { addToast } = useToast();
  const {
    isOpen: slideOverOpen,
    isExisting: slideOverExisting,
    draft: slideOverDraft,
    cheapestCompetitor: slideOverCheapest,
    openSlideOver,
    closeSlideOver,
    updateDraft,
    refreshFromTable,
    confirmAddToStore,
  } = useMarginSlideOver();

  const handleBrandHover = useCallback((brandName: string | null) => {
    setHighlightedBrand(brandName);
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Marcas configuradas -> competidores con sufijo para duplicadas (derivado, sin estado)
  const competidores = useMemo(() => {
    const marcas: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const marcaKey = `marca${i}` as keyof IForm;
      const marca = formState.precios[marcaKey];
      if (typeof marca === 'string' && marca.trim() !== '') {
        marcas.push(marca.trim());
      }
    }

    if (marcas.length < 2) {
      return [DEFAULT_MY_BRAND, 'Competidor 1'];
    }

    const marcasUnicas: string[] = [];
    const contadorMarcas: { [key: string]: number } = {};
    for (const marca of marcas) {
      if (marcasUnicas.includes(marca)) {
        contadorMarcas[marca] = (contadorMarcas[marca] || 1) + 1;
        marcasUnicas.push(`${marca}${contadorMarcas[marca]}`);
      } else {
        contadorMarcas[marca] = 1;
        marcasUnicas.push(marca);
      }
    }
    return marcasUnicas;
  }, [formState.precios]);

  useEffect(() => { cargarCatalogo(); }, [cargarCatalogo]);

  const searchResults = useSearch(catalogo, searchTerm);

  const toggleSearchResultSelection = useCallback((codigo: string) => {
    setSelectedSearchResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codigo)) newSet.delete(codigo); else newSet.add(codigo);
      return newSet;
    });
  }, []);

  const toggleSelectAllSearchResults = useCallback(() => {
    if (selectedSearchResults.size === searchResults.length) {
      setSelectedSearchResults(new Set());
    } else {
      setSelectedSearchResults(new Set(searchResults.map(p => p.codigo)));
    }
  }, [searchResults, selectedSearchResults.size]);

  const addSelectedSearchResults = useCallback(() => {
    const productsToAdd = searchResults.filter(p => selectedSearchResults.has(p.codigo));
    productsToAdd.forEach(p => agregarProductoToLista(p));
    setSearchTerm('');
    setSelectedSearchResults(new Set());
    if (productsToAdd.length > 0) {
      addToast(`${productsToAdd.length} producto(s) agregado(s) a la lista.`, 'success');
    }
  }, [searchResults, selectedSearchResults, agregarProductoToLista, addToast]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setSelectedSearchResults(new Set());
  }, []);

  const handleAddManual = useCallback(() => {
    agregarProductoToLista({ codigo: searchTerm, nombre: searchTerm, ean_14: '', peso: 0, stock_referencial: 0, linea: '', keywords: [] });
    setSearchTerm('');
    setSelectedSearchResults(new Set());
  }, [agregarProductoToLista, searchTerm]);

  const handlePriceChange = useCallback((codigo: string, competidor: string, valor: number | null) => {
    const productoActual = lista.find(p => p.codigo === codigo);
    if (!productoActual) return;

    const nuevosPrecios = { ...(productoActual.precios || {}) };
    if (valor === null) { delete nuevosPrecios[competidor]; } else { nuevosPrecios[competidor] = valor; }
    actualizarProductoEnLista(codigo, 'precios', nuevosPrecios);
  }, [lista, actualizarProductoEnLista]);

  const handleCostChange = useCallback((codigo: string, valor: number | null) => {
    const productoActual = lista.find(p => p.codigo === codigo);
    if (!productoActual) return;
    const marginProduct = marginProductos.find(m => m.codigo === codigo);
    if (marginProduct) {
      actualizarCampoMarginProducto(codigo, 'costo', valor);
    } else {
      agregarProductoConCosto(productoActual, valor);
    }
  }, [lista, marginProductos, actualizarCampoMarginProducto, agregarProductoConCosto]);

  const handleDeleteProduct = useCallback((codigo: string) => {
    eliminarProductoDeLista(codigo);
    eliminarMarginProducto(codigo);
  }, [eliminarProductoDeLista, eliminarMarginProducto]);

  const dataConPorcentajes = useMemo(() => calculateDataWithPercentages(lista, competidores), [lista, competidores]);

  const sortedData = useMemo(() => {
    const data = dataConPorcentajes;
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === 'string' && aValue.includes('%')) {
        const aNum = parseFloat(aValue.replace('%', ''));
        const bNum = parseFloat((bValue as string).replace('%', ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
      }
      return 0;
    });
  }, [dataConPorcentajes, sortConfig]);

  const dashboardKPIs = useComparadorKPIs(dataConPorcentajes, competidores);

  const {
    isSubmitting, confirmState, setConfirmState, handlePngExportClick, handleHTMLExport, handleClearAll,
  } = useComparadorExport(
    competidores, dataConPorcentajes, dashboardKPIs, formState, comparisonTableRef, exportWrapperRef, dashboardRef,
  );

  const handleOpenSlideOver = useCallback((item: ComparisonTableRow) => {
    openSlideOver(item, competidores);
  }, [competidores, openSlideOver]);

  const handleRefreshSlideOver = useCallback(() => {
    if (!slideOverDraft) return;
    const item = dataConPorcentajes.find(p => p.codigo === slideOverDraft.codigo);
    if (item) refreshFromTable(item, competidores);
  }, [dataConPorcentajes, competidores, slideOverDraft, refreshFromTable]);

  const columns = useComparadorColumns({
    competidores,
    highlightedBrand,
    onPriceChange: handlePriceChange,
    onSort: handleSort,
    onBrandHover: handleBrandHover,
    onDeleteProduct: handleDeleteProduct,
    onViewChart: setSelectedProductForChart,
    onOpenSlideOver: handleOpenSlideOver,
    onCostChange: handleCostChange,
    marginProductos,
  });

  const fieldConfig: FieldConfig = { showRucDni: true, showCodigoCliente: true, showSucursal: true, showFecha: true, showMarcas: true };

  const { userName } = useAuth();

  return (
    <div className="min-h-screen pb-8 sm:pb-12 md:pb-20 transition-colors duration-500 module-comparador relative" role="main">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-[var(--color-comparador-primary)] opacity-[0.04] blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-[var(--color-comparador-light)] opacity-[0.03] blur-[100px]"></div>
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none bg-dots-dark" aria-hidden="true"></div>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[var(--color-primary-500)] text-[var(--color-text-inverse)] px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-offset-2">
        Ir al contenido principal
      </a>

      <div className="container-app py-3 space-y-4" id="main-content">
        <ComparadorHeader />

        <section className="glass-card p-4 animate-slide-up section-tint-comparador" style={{ animationDelay: '100ms' }} aria-labelledby="form-section-title">
          <h2 id="form-section-title" className="sr-only">Formulario de Datos Generales</h2>
          <DatosGeneralesForm tipo="precios" formState={formState.precios} fieldConfig={fieldConfig} />
        </section>

        <ComparadorSearchSection
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchTermChange}
          catalogLoading={catalogLoading}
          searchResults={searchResults}
          selectedIds={selectedSearchResults}
          addedIds={new Set(lista.map(p => p.codigo))}
          isMobile={isMobile}
          listaLength={lista.length}
          formPreciosCount={Object.keys(formState.precios).length}
          onToggleSelection={toggleSearchResultSelection}
          onToggleSelectAll={toggleSelectAllSearchResults}
          onAddSelected={addSelectedSearchResults}
          onAddManual={handleAddManual}
          onClearAll={handleClearAll}
        />

        {lista.length > 0 && (
          <ComparadorQuickMetrics
            productosCount={lista.length}
            priceWins={dashboardKPIs?.priceWins ?? 0}
            averageRanking={dashboardKPIs?.averageRanking ?? 0}
            marcasCount={competidores.length}
          />
        )}

        <div ref={exportWrapperRef} className="export-wrapper space-y-4">
          <ComparadorTableSection
            comparisonTableRef={comparisonTableRef}
            isSubmitting={isSubmitting}
            onHtmlExport={handleHTMLExport}
            onPngExportClick={handlePngExportClick}
            listaLength={lista.length}
            dataConPorcentajes={dataConPorcentajes}
            sortedData={sortedData}
            columns={columns}
            competidores={competidores}
            marginProductos={marginProductos}
            isMobile={isMobile}
            cliente={formState.precios.cliente || ''}
            documento={formState.precios.documento_cliente}
            codigo_cliente={formState.precios.codigo_cliente}
            sucursal={formState.precios.sucursal}
            responsable={userName || ''}
            onPriceChange={handlePriceChange}
            onCostChange={handleCostChange}
            onDeleteProduct={handleDeleteProduct}
            onViewChart={setSelectedProductForChart}
            onOpenSlideOver={handleOpenSlideOver}
          />

          {lista.length > 0 && (
            <AnalisisIndividualSection
              sortedData={sortedData}
              competidores={competidores}
              marginProductos={marginProductos}
              highlightedBrand={highlightedBrand}
              onBrandHover={handleBrandHover}
            />
          )}

          {dashboardKPIs && (
            <ComparadorDashboardSection
              dashboardRef={dashboardRef}
              data={dataConPorcentajes}
              competidores={competidores}
            />
          )}
        </div>
      </div>

      <ProductBarChartModal product={selectedProductForChart} competidores={competidores} marginProductos={marginProductos} onClose={() => setSelectedProductForChart(null)} />

      <MarginSlideOver
        isOpen={slideOverOpen}
        isExisting={slideOverExisting}
        draft={slideOverDraft}
        cheapestCompetitor={slideOverCheapest}
        onClose={closeSlideOver}
        onUpdateCampo={(campo, valor) => updateDraft(campo as 'costo' | 'precioTienda' | 'prop1Precio' | 'prop2Costo' | 'prop2Precio', valor)}
        onRefresh={handleRefreshSlideOver}
        onConfirmAdd={confirmAddToStore}
      />

      <ConfirmModal isOpen={!!confirmState} onConfirm={() => confirmState?.onConfirm()} onCancel={() => setConfirmState(null)} title="Confirmar" message={confirmState?.message || ''} confirmText="Sí, continuar" variant="danger" />
    </div>
  );
};
