import { useMemo } from 'react';
import type { ComparisonTableRow } from '../interfaces';
import type { IColumn } from '../components/DataTable';
import { PriceInput } from '../components/comparador/PriceInput';
import { getBrandColorByPosition, getBrandHeaderStylesByPosition } from '../utils/colorScheme';
import { Tooltip } from '../components/ui';
import { PieChart as PieChartIcon, Trash2, Calculator } from 'lucide-react';
import type { MarginProduct } from '../store/useMarginStore';

interface UseComparadorColumnsParams {
  competidores: string[];
  highlightedBrand: string | null;
  onPriceChange: (codigo: string, competidor: string, valor: number | null) => void;
  onSort: (key: string) => void;
  onBrandHover: (brandName: string | null) => void;
  onDeleteProduct: (codigo: string) => void;
  onViewPieChart: (item: ComparisonTableRow) => void;
  onOpenSlideOver: (item: ComparisonTableRow) => void;
  marginProductos?: MarginProduct[];
}

const CompactComparisonBar = ({ percentage }: { percentage: string | undefined }) => {
  if (!percentage || percentage === 'N/A') {
    return <span className="text-[var(--text-tertiary)] text-xs italic">—</span>;
  }

  const value = parseFloat(percentage.replace('%', ''));
  if (!isFinite(value)) return <span className="text-[var(--text-tertiary)] text-xs italic">—</span>;

  const isGood = value < 0;
  const absValue = Math.min(Math.abs(value), 50);
  const width = `${(absValue / 50) * 100}%`;
  const colorClass = isGood ? 'bg-[var(--color-on-surface-success)]' : 'bg-[var(--color-on-surface-error)]';
  const textColorClass = isGood ? 'text-[var(--color-on-surface-success)]' : 'text-[var(--color-on-surface-error)]';

  return (
    <div className="flex items-center gap-1.5 w-full mt-0.5">
      <span className={`text-xs font-semibold ${textColorClass} whitespace-nowrap`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}%
      </span>
      <div className="h-1.5 flex-1 bg-[var(--border-secondary)] rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500 ease-out`} style={{ width }} />
      </div>
    </div>
  );
};

export const useComparadorColumns = ({
  competidores,
  highlightedBrand,
  onPriceChange,
  onSort,
  onBrandHover,
  onDeleteProduct,
  onViewPieChart,
  onOpenSlideOver,
  marginProductos,
}: UseComparadorColumnsParams): IColumn<ComparisonTableRow>[] => {
  return useMemo((): IColumn<ComparisonTableRow>[] => {
    const baseCompetitor = competidores[0];

    const baseColumn: IColumn<ComparisonTableRow> = {
      header: (
        <div
          style={getBrandHeaderStylesByPosition(baseCompetitor, competidores)}
          className={`px-2 py-1 rounded-lg text-center text-xs font-semibold transition-opacity duration-200 ${highlightedBrand && highlightedBrand !== baseCompetitor ? 'opacity-50' : ''}`}
          onMouseEnter={() => onBrandHover(baseCompetitor)}
          onMouseLeave={() => onBrandHover(null)}
        >
          {baseCompetitor}
        </div>
      ),
      accessor: `precios.${baseCompetitor}`,
      sortable: true,
      onSort,
      cellRenderer: (item) => (
        <PriceInput
          initialValue={item.precios?.[baseCompetitor] ?? null}
          onPriceChange={(value) => onPriceChange(item.codigo, baseCompetitor, value)}
          competidor={baseCompetitor}
          item={item}
          isBestOffer={item.mejor_precio_competidor === baseCompetitor}
          textColor={getBrandColorByPosition(baseCompetitor, competidores)}
        />
      ),
    };

    const competitorColumns: IColumn<ComparisonTableRow>[] = competidores.slice(1).map((comp) => {
      const color = getBrandColorByPosition(comp, competidores);
      const pctKey = `% vs ${comp}`;
      return {
        header: (
          <div
            style={getBrandHeaderStylesByPosition(comp, competidores)}
            className={`px-2 py-1 rounded-lg text-center transition-opacity duration-200 cursor-pointer hover:opacity-80 ${highlightedBrand && highlightedBrand !== comp ? 'opacity-50' : ''}`}
            onMouseEnter={() => onBrandHover(comp)}
            onMouseLeave={() => onBrandHover(null)}
            onClick={() => onSort(`precios.${comp}`)}
          >
            <div className="text-xs font-semibold">{comp}</div>
            <div className="text-xs opacity-70 mt-0.5">% vs {baseCompetitor}</div>
          </div>
        ),
        accessor: `precios.${comp}`,
        sortable: true,
        onSort,
        cellRenderer: (item) => {
          const valorPct = (item as Record<string, string | undefined>)[pctKey];
          return (
            <div className="flex flex-col items-stretch gap-0.5">
              <PriceInput
                initialValue={item.precios?.[comp] ?? null}
                onPriceChange={(value) => onPriceChange(item.codigo, comp, value)}
                competidor={comp}
                item={item}
                isBestOffer={item.mejor_precio_competidor === comp}
                textColor={color}
              />
              <CompactComparisonBar percentage={valorPct} />
            </div>
          );
        },
      };
    });

	return [
		{ header: 'Código', accessor: 'codigo', cellClassName: 'w-16 text-sm text-[var(--text-primary)] column-frozen-1', headerClassName: 'column-frozen-1', sortable: true, onSort, cellRenderer: (item) => (
			<div className="flex flex-col gap-0.5">
				<span className="font-mono text-xs font-bold" style={{ color: 'var(--color-sku-accent)' }}>{item.codigo}</span>
				<span className="text-[11px] leading-tight nombre-inline sm:hidden line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{item.nombre}</span>
			</div>
		) },
		{
			header: 'Nombre',
			accessor: 'nombre',
			cellClassName: 'min-w-[180px] max-w-[300px] sm:max-w-[400px] text-sm product-name-column column-frozen-2 nombre-column',
			headerClassName: 'column-frozen-2 nombre-header',
			sortable: true,
			onSort,
			cellRenderer: (item) => (
				<Tooltip content={item.nombre} position="right">
					<div className="flex flex-col gap-0.5 min-w-0">
						<span 
							className="text-[13px] font-medium leading-tight line-clamp-2 block" 
							title={item.nombre}
							style={{ color: 'var(--text-primary)' }}
						>
							{item.nombre}
						</span>
						<span 
							className="text-[10px] font-mono leading-none hidden sm:block"
							style={{ color: 'var(--text-tertiary)' }}
						>
							{item.codigo}
							{item.linea && <span className="ml-1.5">· {item.linea}</span>}
						</span>
					</div>
				</Tooltip>
			),
		},

    baseColumn,

    ...competitorColumns,

      {
        header: '',
        accessor: 'accion',
        cellClassName: 'column-acciones',
        headerClassName: 'column-acciones',
  cellRenderer: (item) => (
    <div className="flex items-center gap-1">
      <Tooltip content="Ver gráfico de torta" position="left">
        <button
          onClick={() => onViewPieChart(item)}
          className="p-1.5 rounded-md hover:bg-[var(--color-comparador-primary)]/10 text-[var(--color-comparador-primary)] transition-all duration-200"
          aria-label={`Ver gráfico de torta para ${item.nombre}`}
        >
          <PieChartIcon className="h-4 w-4" />
        </button>
      </Tooltip>
              <Tooltip content="Analizar margen de ganancia" position="left">
                <button
                  onClick={() => onOpenSlideOver(item)}
                  className="p-1.5 rounded-md hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-all duration-200 relative"
                  aria-label={`Analizar margen para ${item.nombre}`}
                >
                  <Calculator className="h-4 w-4" />
                  {marginProductos?.some(mp => mp.codigo === item.codigo) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-success)] rounded-full border border-[var(--surface-elevated)]" />
                  )}
                </button>
              </Tooltip>
      <Tooltip content="Eliminar de la lista" position="left">
        <button
          onClick={() => onDeleteProduct(item.codigo)}
          className="p-1.5 rounded-md hover:bg-[var(--color-danger)]/10 text-[var(--color-danger)] transition-all duration-200"
          aria-label={`Eliminar ${item.nombre}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  ),
      },
    ];
  }, [competidores, highlightedBrand, onPriceChange, onSort, onBrandHover, onDeleteProduct, onViewPieChart, onOpenSlideOver, marginProductos]);
};
