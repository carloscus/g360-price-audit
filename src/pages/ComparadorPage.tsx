import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IForm, FieldConfig, ComparisonTableRow } from '../interfaces';
import { calculateDataWithPercentages } from '../utils/comparisonUtils';
import { DataTable } from '../components/DataTable';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/ToastContext';
import { SearchInput } from '../components/ui/SearchInput';
import { ProductAnalysisCardWithBarChartRefactor } from '../components/comparador/ProductAnalysisCardWithBarChartRefactor';
import { ProductPieChartModal } from '../components/comparador/ProductPieChartModal';
import PricePieChart from '../components/comparador/PricePieChart';
import { BrandRankingChart } from '../components/comparador/BrandRankingChart';
import { getBrandColor } from '../utils/colorScheme';
import { PieChart as PieChartIcon, Download, RefreshCw, Search, BarChart3, Trophy, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { Tooltip, ConfirmModal, SearchResultsDropdown } from '../components/ui';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import { ExcelJSExportButton } from '../components/ExcelJSExportButton';
import { useComparadorKPIs } from '../hooks/useComparadorKPIs';
import { useComparadorExport } from '../hooks/useComparadorExport';
import { useComparadorColumns } from '../hooks/useComparadorColumns';
import { useMarginSlideOver } from '../hooks/useMarginSlideOver';
import { MarginSlideOver } from '../components/margen/MarginSlideOver';
import { BulkImportButton } from '../components/comparador/BulkImportButton';
import { useMarginStore } from '../store/useMarginStore';

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
  const eliminarMarginProducto = useMarginStore((state) => state.eliminarProducto);

const [searchTerm, setSearchTerm] = useState('');
  const [competidores, setCompetidores] = useState<string[]>([]);
  const [selectedProductForPieChart, setSelectedProductForPieChart] = useState<ComparisonTableRow | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<string>>(new Set());
  const [highlightedBrand, setHighlightedBrand] = useState<string | null>(null);
  const [visibleProducts, setVisibleProducts] = useState<number>(10);

const dashboardRef = useRef<HTMLDivElement>(null);
const exportWrapperRef = useRef<HTMLDivElement>(null);
const comparisonTableRef = useRef<HTMLDivElement>(null);
const searchInputRef = useRef<HTMLInputElement>(null);

const { addToast } = useToast();
const slideOver = useMarginSlideOver();

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

useEffect(() => {
	const marcas: string[] = [];
	for (let i = 1; i <= 5; i++) {
		const marcaKey = `marca${i}` as keyof IForm;
		const marca = formState.precios[marcaKey];
		if (typeof marca === 'string' && marca.trim() !== '') {
			marcas.push(marca.trim());
		}
	}

	if (marcas.length < 2) {
		setCompetidores(['Mi Marca', 'Competidor 1']);
	} else {
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
		setCompetidores(marcasUnicas);
	}
}, [formState.precios, addToast]);

useEffect(() => { cargarCatalogo(); }, [cargarCatalogo]);

const searchResults = useSearch(catalogo, searchTerm);
const displayedResults = searchResults;

const toggleSearchResultSelection = useCallback((codigo: string) => {
	setSelectedSearchResults(prev => {
		const newSet = new Set(prev);
		if (newSet.has(codigo)) newSet.delete(codigo); else newSet.add(codigo);
		return newSet;
	});
}, []);

const toggleSelectAllSearchResults = useCallback(() => {
	if (selectedSearchResults.size === displayedResults.length) {
		setSelectedSearchResults(new Set());
	} else {
		setSelectedSearchResults(new Set(displayedResults.map(p => p.codigo)));
	}
}, [displayedResults, selectedSearchResults.size]);

const addSelectedSearchResults = useCallback(() => {
	const productsToAdd = displayedResults.filter(p => selectedSearchResults.has(p.codigo));
	productsToAdd.forEach(p => agregarProductoToLista(p));
	setSearchTerm('');
	setSelectedSearchResults(new Set());
	if (productsToAdd.length > 0) {
		addToast(`${productsToAdd.length} producto(s) agregado(s) a la lista.`, 'success');
	}
}, [displayedResults, selectedSearchResults, agregarProductoToLista, addToast]);

useEffect(() => { setSelectedSearchResults(new Set()); }, [searchTerm]);

const handlePriceChange = useCallback((codigo: string, competidor: string, valor: number | null) => {
	const productoActual = lista.find(p => p.codigo === codigo);
	if (!productoActual) return;

  const nuevosPrecios = { ...(productoActual.precios || {}) };
  if (valor === null) { delete nuevosPrecios[competidor]; } else { nuevosPrecios[competidor] = valor; }
  actualizarProductoEnLista(codigo, 'precios', nuevosPrecios);
  }, [lista, actualizarProductoEnLista]);

  const handleDeleteProduct = useCallback((codigo: string) => {
    eliminarProductoDeLista(codigo);
    eliminarMarginProducto(codigo);
  }, [eliminarProductoDeLista, eliminarMarginProducto]);

  const dataConPorcentajes = useMemo(() => calculateDataWithPercentages(lista, competidores), [lista, competidores]);

const sortedData = useMemo(() => {
	let data = dataConPorcentajes;
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
    slideOver.openSlideOver(item, competidores);
  }, [competidores, slideOver.openSlideOver]);

  const handleRefreshSlideOver = useCallback(() => {
    if (!slideOver.draft) return;
    const item = dataConPorcentajes.find(p => p.codigo === slideOver.draft!.codigo);
    if (item) slideOver.refreshFromTable(item, competidores);
  }, [dataConPorcentajes, competidores, slideOver.draft, slideOver.refreshFromTable]);

  const columns = useComparadorColumns({
    competidores,
    highlightedBrand,
    onPriceChange: handlePriceChange,
    onSort: handleSort,
    onBrandHover: handleBrandHover,
    onDeleteProduct: handleDeleteProduct,
    onViewPieChart: setSelectedProductForPieChart,
    onOpenSlideOver: handleOpenSlideOver,
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
			<div className="flex items-center justify-between animate-fade-in" role="banner">
				<div>
					<h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight" id="page-title">Comparador de Precios</h1>
					<p className="text-sm text-[var(--text-secondary)]" id="page-description">Compara precios entre competidores en tiempo real.</p>
				</div>
				{marginProductos.length > 0 && (
					<div className="flex items-center gap-2 text-xs">
						<span className="text-[var(--text-secondary)]">SKUs simulados:</span>
						<span className="font-mono font-bold bg-[var(--surface-elevated)] px-2 py-1 rounded">
							{marginProductos.length}
						</span>
					</div>
				)}
			</div>

			<section className="glass-card p-4 animate-slide-up section-tint-comparador" style={{ animationDelay: '100ms' }} aria-labelledby="form-section-title">
				<h2 id="form-section-title" className="sr-only">Formulario de Datos Generales</h2>
				<DatosGeneralesForm tipo="precios" formState={formState.precios} fieldConfig={fieldConfig} />
			</section>

			<section className="glass-card p-3 sm:p-4 animate-slide-up section-tint-comparador" style={{ animationDelay: '200ms' }} aria-labelledby="search-section-title">
				<h2 id="search-section-title" className="sr-only">Búsqueda y Selección de Productos</h2>
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2 sm:gap-3">
					<h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Búsqueda y Selección</h3>
					<div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto" role="group" aria-label="Acciones de producto">
						<LineSelectorModalTrigger 
							moduloKey="precios" 
							buttonClassName="text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial flex items-center justify-center hover:bg-[var(--color-primary-500)] hover:text-white hover:border-[var(--color-primary-500)] transition-all" 
						/>
						<BulkImportButton />
						<Tooltip content="Añadir producto manualmente si no se encuentra en la búsqueda" position="top">
							<button onClick={() => { agregarProductoToLista({ codigo: searchTerm, nombre: searchTerm, ean_14: '', peso: 0, stock_referencial: 0, linea: '', keywords: [] }); setSearchTerm(''); }} disabled={!searchTerm || displayedResults.length > 0} className="btn btn-primary text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial" aria-label="Añadir producto manualmente">
								Añadir Manualmente
							</button>
						</Tooltip>
						<Tooltip content="Limpiar formulario y lista de productos" position="top">
							<button onClick={handleClearAll} disabled={lista.length === 0 && Object.keys(formState.precios).length === 0} className="btn btn-danger text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial flex items-center justify-center gap-2" aria-label="Limpiar formulario y lista de productos" aria-describedby="clear-instruction">
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
						onChange={(e) => setSearchTerm(e.target.value)}
						onClear={() => setSearchTerm('')}
						loading={catalogLoading}
						className="text-base sm:text-lg"
					/>
					<div id="search-instruction" className="sr-only">Ingrese el código, EAN o nombre del producto para buscar.</div>
					<SearchResultsDropdown isOpen={displayedResults.length > 0} results={displayedResults} selectedIds={selectedSearchResults} addedIds={new Set(lista.map(p => p.codigo))} onToggleSelection={toggleSearchResultSelection} onToggleSelectAll={toggleSelectAllSearchResults} onAddSelected={addSelectedSearchResults} searchInputRef={searchInputRef} searchTerm={searchTerm} onClose={() => setSearchTerm('')} />
				</div>
			</section>

			<div ref={exportWrapperRef} className="export-wrapper space-y-4">
				<section ref={comparisonTableRef} className="glass-card p-3 animate-slide-up section-tint-comparador" style={{ animationDelay: '400ms' }}>
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
							<h2 className="text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">Tabla de Comparación</h2>
						</div>
						<div className="flex flex-wrap gap-3" role="group" aria-label="Acciones de exportación">
							<ExcelJSExportButton productos={dataConPorcentajes.map(p => { const mp = marginProductos.find(m => m.codigo === p.codigo); return { ...p, precios: p.precios ?? Object.fromEntries(competidores.map(m => [m, null])), costo: mp?.costo ?? null, precioTienda: mp?.precioTienda ?? null, linea: mp?.linea ?? p.linea, prop1Precio: mp?.prop1Precio ?? null, prop2Costo: mp?.prop2Costo ?? null, prop2Precio: mp?.prop2Precio ?? null, prop2CantidadMinima: mp?.prop2CantidadMinima ?? null, }; })} marcas={competidores} cliente={formState.precios.cliente || ''} documento={formState.precios.documento_cliente} codigo_cliente={formState.precios.codigo_cliente} sucursal={formState.precios.sucursal} responsable={userName || ''} disabled={isSubmitting || lista.length === 0} />
							<Tooltip content="Exportar como página HTML navegable" position="top">
								<button onClick={handleHTMLExport} disabled={isSubmitting || lista.length === 0} className="btn btn-primary" aria-label={isSubmitting ? "Generando HTML..." : "Exportar como HTML navegable"} aria-busy={isSubmitting}>
									{isSubmitting ? (
										<span className="flex items-center gap-2">											<svg className="animate-spin h-4 w-4 text-[var(--color-btn-primary-text)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A77.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generando...</span></span>
									) : (
										<span className="flex items-center gap-2"><Download className="w-5 h-5" aria-hidden="true" /><span>Exportar HTML</span></span>
									)}
								</button>
							</Tooltip>
							<Tooltip content="Exportar tabla de comparación a PNG" position="top">
								<button onClick={handlePngExportClick} disabled={isSubmitting || lista.length === 0} className="btn btn-primary" aria-label={isSubmitting ? "Generando PNG..." : "Exportar tabla de comparación a PNG"} aria-busy={isSubmitting}>
									{isSubmitting ? (
											<span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4 text-[var(--color-btn-primary-text)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Generando...</span></span>
									) : (
										<span className="flex items-center gap-2"><Download className="w-5 h-5" aria-hidden="true" /><span>Exportar PNG</span></span>
									)}
								</button>
							</Tooltip>
						</div>
					</div>

					{lista.length > 0 ? (
						<div className="rounded-xl overflow-hidden border border-[var(--border-primary)] shadow-sm">
							<DataTable data={sortedData} columns={columns} tableClassName="w-full" />
						</div>
					) : (
						<div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-[var(--border-secondary)] bg-[var(--color-comparador-surface)] animate-fade-in">
							<div className="w-14 h-14 mx-auto bg-[var(--surface-elevated)] rounded-xl flex items-center justify-center mb-4 shadow-md border border-[var(--border-primary)]">
								<PieChartIcon className="h-7 w-7 text-[var(--color-comparador-primary)]" />
							</div>
							<h3 className="text-base font-semibold text-[var(--text-primary)]">Comienza a comparar</h3>
							<p className="mt-1 text-[var(--text-secondary)] max-w-md mx-auto text-sm leading-relaxed">Utiliza el buscador superior para agregar productos a la lista y comenzar el análisis de precios.</p>
						</div>
					)}
				</section>

				{lista.length > 0 && (
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
							{sortedData.slice(0, visibleProducts).map(item => (
								<div key={`card-wrapper-${item.codigo}`} id={`product-card-${item.codigo}`}>
									<ProductAnalysisCardWithBarChartRefactor key={item.codigo} item={item} competidores={competidores} highlightedBrand={highlightedBrand} onBrandHover={handleBrandHover} />
								</div>
							))}
						</div>
					</section>
				)}

{dashboardKPIs && (
					<section ref={dashboardRef} className="glass-card p-3 animate-slide-up section-tint-comparador" style={{ animationDelay: '300ms' }} aria-labelledby="dashboard-section-title">
						<h2 id="dashboard-section-title" className="sr-only">Dashboard de Comparación de Precios</h2>
						<div className="flex justify-between items-center mb-2 sm:mb-3">
							<h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Dashboard</h3>
							<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-secondary)]" aria-hidden="true" />
						</div>
						<BrandRankingChart data={dataConPorcentajes} competidores={competidores} />
					</section>
				)}
			</div>
		</div>

		<ProductPieChartModal product={selectedProductForPieChart} competidores={competidores} onClose={() => setSelectedProductForPieChart(null)} />

      <MarginSlideOver
        isOpen={slideOver.isOpen}
        isExisting={slideOver.isExisting}
        draft={slideOver.draft}
        cheapestCompetitor={slideOver.cheapestCompetitor}
        onClose={slideOver.closeSlideOver}
        onUpdateCampo={(campo, valor) => slideOver.updateDraft(campo as 'costo' | 'precioTienda' | 'prop1Precio' | 'prop2Costo' | 'prop2Precio', valor)}
        onRefresh={handleRefreshSlideOver}
        onConfirmAdd={slideOver.confirmAddToStore}
      />

		<ConfirmModal isOpen={!!confirmState} onConfirm={() => confirmState?.onConfirm()} onCancel={() => setConfirmState(null)} title="Confirmar" message={confirmState?.message || ''} confirmText="Sí, continuar" variant="danger" />
	</div>
);
};
