import React from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Percent, TrendingUp, Target, Trophy, Plus, Package, ArrowDownUp, Medal, BarChart3, RefreshCw } from 'lucide-react';
import { PriceInputEnhanced, ProfitDisplay } from '../ui/PriceInputEnhanced';

interface CompetidorPrecio {
  brand: string;
  price: number | null;
  difS: number | null;
  difPct: number | null;
}

type CampoDraft = 'costo' | 'precioTienda' | 'prop1Precio' | 'prop2Costo' | 'prop2Precio' | 'prop2CantidadMinima';

interface MarginSlideOverProps {
  isOpen: boolean;
  isExisting?: boolean;
  draft: {
    codigo: string;
    nombre: string;
    linea: string;
    costo: number | null;
    precioTienda: number | null;
    preciosCompetencia: Record<string, number | null>;
    margenActual: number | null;
    gananciaActual: number | null;
    rankingActual: number | null;
    prop1Precio: number | null;
    prop1Margen: number | null;
    prop1Ganancia: number | null;
    prop1Ranking: number | null;
    prop2Costo: number | null;
    prop2Precio: number | null;
    prop2CantidadMinima: number | null;
    prop2Margen: number | null;
    prop2Ganancia: number | null;
    prop2DifCosto: number | null;
    prop2DifCostoPct: number | null;
    prop2Ranking: number | null;
  } | null;
  cheapestCompetitor: { brand: string; price: number } | null;
  onClose: () => void;
  onUpdateCampo: (campo: CampoDraft, valor: number | null) => void;
  onRefresh: () => void;
  onConfirmAdd: () => void;
}

const RankingBadge: React.FC<{ ranking: number | null; total: number }> = ({ ranking, total }) => {
  if (ranking === null) return <span className="text-[var(--text-tertiary)]">—</span>;
  const color = ranking === 1
    ? 'bg-[var(--color-success-500)] text-[var(--color-text-inverse)]'
    : ranking <= Math.ceil(total / 2)
      ? 'bg-[var(--color-warning-500)] text-[var(--color-text-inverse)]'
      : 'bg-[var(--color-input-tint-error-bg)] text-[var(--color-on-surface-error)]';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <Medal className="w-3 h-3" />
      #{ranking}/{total}
    </span>
  );
};

export const MarginSlideOver: React.FC<MarginSlideOverProps> = ({
  isOpen,
  isExisting,
  draft,
  cheapestCompetitor,
  onClose,
  onUpdateCampo,
  onRefresh,
  onConfirmAdd,
}) => {
  if (!isOpen || !draft) return null;

  const simulation = {
    p2: {
      cantidadMinima: draft.prop2CantidadMinima !== null && draft.prop2CantidadMinima !== undefined ? draft.prop2CantidadMinima : ''
    }
  };
  const sku = {
    codigo: draft.codigo
  };
  const updateP2Cantidad = (codigo: string, value: number) => {
    onUpdateCampo('prop2CantidadMinima', value || null);
  };

  const competenciaEntries: CompetidorPrecio[] = Object.entries(draft.preciosCompetencia).map(
    ([brand, price]) => {
      const difS = draft.precioTienda !== null && price !== null
        ? draft.precioTienda - price : null;
      const difPct = draft.precioTienda !== null && price !== null && price > 0
        ? ((draft.precioTienda / price) - 1) * 100 : null;
      return { brand, price, difS, difPct };
    },
  );

  const totalCompetidores = Object.keys(draft.preciosCompetencia).length + 1;

  const isCheapest = cheapestCompetitor === null
    || (draft.precioTienda !== null && draft.precioTienda <= cheapestCompetitor.price);

  return createPortal(
    <>
      <div className="margin-slide-over-backdrop fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
      <div className="margin-slide-over fixed inset-y-0 right-0 w-full sm:max-w-[340px] bg-[var(--surface-primary)] shadow-2xl flex flex-col z-[9999] border-l border-[var(--border-primary)] overflow-hidden" role="dialog" aria-modal="true">
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] relative z-[105]">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="w-4 h-4 text-[var(--color-primary-500)] flex-shrink-0" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">
              Margen Competitivo
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 relative z-[120]">
            <button
              onClick={onRefresh}
              className="rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--color-primary-500)] transition-colors h-8 w-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              title="Actualizar precios desde la tabla"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full h-8 w-8 flex items-center justify-center bg-[var(--color-input-tint-error-bg)] text-[var(--color-on-surface-error)] hover:bg-[var(--color-error-500)] hover:text-[var(--color-text-inverse)] transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-error-500)]"
              aria-label="Cerrar simulador"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {draft.codigo}
              </span>
            </div>
            <p className="text-[var(--text-primary)] font-semibold text-base leading-snug">
              {draft.nombre}
            </p>
            {draft.linea && (
              <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                {draft.linea}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Competencia en Tienda
            </h3>
            <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-primary-600)] text-[var(--color-text-inverse)]">
                    <th className="px-3 py-2 text-xs font-semibold text-left">Marca</th>
                    <th className="px-3 py-2 text-xs font-semibold text-right">Precio</th>
                    <th className="px-3 py-2 text-xs font-semibold text-right">Dif S/</th>
                    <th className="px-3 py-2 text-xs font-semibold text-right">Dif %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[var(--color-input-tint-primary-bg)] border-b border-[var(--border-secondary)] transition-colors duration-500">
                    <td className="px-3 py-2 font-semibold text-[var(--text-primary)]">
                      Mi Marca
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-[var(--text-primary)]">
                      {draft.precioTienda !== null
                        ? `S/ ${draft.precioTienda.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--text-tertiary)]">—</td>
                    <td className="px-3 py-2 text-right text-[var(--text-tertiary)]">—</td>
                  </tr>
                  {competenciaEntries.map((comp) => (
                    <tr key={comp.brand} className="border-b border-[var(--border-secondary)] last:border-b-0">
                      <td className="px-3 py-2 text-[var(--text-primary)]">{comp.brand}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {comp.price !== null
                          ? `S/ ${comp.price.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${comp.difS !== null
                        ? comp.difS > 0
					? 'text-[var(--color-on-surface-error)]'
					: comp.difS < 0
					? 'text-[var(--color-on-surface-success)]'
					: 'text-[var(--text-tertiary)]'
				: 'text-[var(--text-tertiary)]'}`}>
                        {comp.difS !== null
                          ? `${comp.difS > 0 ? '+' : ''}${comp.difS.toFixed(2)}`
                          : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${comp.difPct !== null
                        ? comp.difPct > 0
					? 'text-[var(--color-on-surface-error)]'
					: comp.difPct < 0
					? 'text-[var(--color-on-surface-success)]'
                            : 'text-[var(--text-tertiary)]'
                        : 'text-[var(--text-tertiary)]'}`}>
                        {comp.difPct !== null
                          ? `${comp.difPct > 0 ? '+' : ''}${comp.difPct.toFixed(2)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isCheapest && draft.precioTienda !== null && (
			<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-on-surface-success)]">
                <Trophy className="w-3.5 h-3.5" />
                <span>Eres el precio más bajo</span>
              </div>
            )}
            {!isCheapest && cheapestCompetitor && draft.precioTienda !== null && (
			<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-on-surface-warning)]">
                <Target className="w-3.5 h-3.5" />
                <span>Más barato: {cheapestCompetitor.brand} a S/ {cheapestCompetitor.price.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Datos Base
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
			<label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-success)]">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Costo (Venta Mayorista)</span>
                </label>
                <PriceInputEnhanced
                  value={draft.costo}
                  onChange={(valor) => onUpdateCampo('costo', valor)}
                  type="costo"
                  showCurrency
                  size="md"
                  className="w-full input-whatif-editable"
                />
              </div>
              <div className="space-y-1.5">
			<label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-warning)]">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Precio Tienda (Mi Marca)</span>
                </label>
                <PriceInputEnhanced
                  value={draft.precioTienda}
                  onChange={(valor) => onUpdateCampo('precioTienda', valor)}
                  type="precio"
                  showCurrency
                  size="md"
                  className="w-full input-whatif-editable"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-info-300)] overflow-hidden">
            <div className="bg-[var(--color-info-500)] text-[var(--color-text-inverse)] px-4 py-2.5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Situación Actual</h3>
            </div>
            <div className="p-4 space-y-2 bg-[var(--color-input-tint-info-bg)]">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Margen</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Percent className="w-3.5 h-3.5 text-[var(--color-primary-500)]" />
                    <span className="text-lg font-bold font-mono text-[var(--color-on-surface-primary)]">
                      {draft.margenActual !== null && isFinite(draft.margenActual) ? `${draft.margenActual.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ganancia</span>
                  <div className="mt-0.5">
                    {draft.gananciaActual !== null
                      ? <ProfitDisplay value={draft.gananciaActual} />
                      : <span className="text-lg font-bold font-mono text-[var(--text-tertiary)]">—</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ranking</span>
                  <div className="mt-0.5">
                    <RankingBadge ranking={draft.rankingActual} total={totalCompetidores} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-primary-300)] overflow-hidden">
            <div className="bg-[var(--color-primary-600)] text-[var(--color-text-inverse)] px-4 py-2.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Propuesta 1 — Mismo Costo, Nuevo Precio</h3>
            </div>
            <div className="p-4 space-y-3 bg-[var(--color-input-tint-primary-bg)]">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-primary)]">
                  <Target className="w-3.5 h-3.5" />
                  <span>Precio Propuesto</span>
                </label>
                <PriceInputEnhanced
                  value={draft.prop1Precio}
                  onChange={(valor) => onUpdateCampo('prop1Precio', valor)}
                  type="precio"
                  showCurrency
                  size="md"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Margen</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Percent className="w-3.5 h-3.5 text-[var(--color-primary-500)]" />
                    <span className="text-lg font-bold font-mono text-[var(--color-on-surface-primary)]">
                      {draft.prop1Margen !== null && isFinite(draft.prop1Margen) ? `${draft.prop1Margen.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ganancia</span>
                  <div className="mt-0.5">
                    {draft.prop1Ganancia !== null
                      ? <ProfitDisplay value={draft.prop1Ganancia} />
                      : <span className="text-lg font-bold font-mono text-[var(--text-tertiary)]">—</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ranking</span>
                  <div className="mt-0.5">
                    <RankingBadge ranking={draft.prop1Ranking} total={totalCompetidores} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-secondary-300)] overflow-hidden">
            <div className="bg-[var(--color-secondary-500)] text-[var(--color-text-inverse)] px-4 py-2.5 flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Propuesta 2 — Nuevo Costo + Nuevo Precio</h3>
            </div>
            <div className="p-4 space-y-3 bg-[var(--color-input-tint-secondary-bg)]">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-secondary)]">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Nuevo Costo</span>
                  </label>
                  <PriceInputEnhanced
                    value={draft.prop2Costo}
                    onChange={(valor) => onUpdateCampo('prop2Costo', valor)}
                    type="costo"
                    showCurrency
                    size="md"
                    className="w-full"
                  />
                  {draft.prop2DifCosto !== null && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-semibold font-mono ${draft.prop2DifCosto > 0 ? 'text-[var(--color-on-surface-success)]' : draft.prop2DifCosto < 0 ? 'text-[var(--color-on-surface-error)]' : 'text-[var(--text-tertiary)]'}`}>
                        {draft.prop2DifCosto > 0 ? '+' : ''}{draft.prop2DifCosto.toFixed(2)}
                      </span>
                      <span className={`font-semibold font-mono ${draft.prop2DifCostoPct !== null && draft.prop2DifCostoPct < 0 ? 'text-[var(--color-on-surface-error)]' : draft.prop2DifCostoPct !== null && draft.prop2DifCostoPct > 0 ? 'text-[var(--color-on-surface-success)]' : 'text-[var(--text-tertiary)]'}`}>
                        ({draft.prop2DifCostoPct !== null && isFinite(draft.prop2DifCostoPct) ? `${draft.prop2DifCostoPct > 0 ? '+' : ''}${draft.prop2DifCostoPct.toFixed(1)}%` : '—'})
                      </span>
                      <span className="text-[var(--text-tertiary)]">vs costo actual</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-secondary)]">
                    <Target className="w-3.5 h-3.5" />
                    <span>Precio Propuesto</span>
                  </label>
                  <PriceInputEnhanced
                    value={draft.prop2Precio}
                    onChange={(valor) => onUpdateCampo('prop2Precio', valor)}
                    type="precio"
                    showCurrency
                    size="md"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-secondary)]">
                    <Package className="w-3.5 h-3.5" />
                    <span>Cantidad Mínima</span>
                  </label>
                  <input 
                    type="number" 
                    className="input-whatif-editable w-full p-2 rounded text-right font-mono font-semibold text-sm bg-[var(--surface-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)]"
                    placeholder="Ej. 100"
                    value={simulation.p2.cantidadMinima}
                    onChange={(e) => updateP2Cantidad(sku.codigo, Number(e.target.value))}
                  />
                  <span className="text-xs text-slate-400 mt-1 block">
                    Cantidad Mínima de Compra (Compromiso del Mayorista)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Margen</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Percent className="w-3.5 h-3.5 text-[var(--color-secondary-500)]" />
                    <span className="text-lg font-bold font-mono text-[var(--color-on-surface-secondary)]">
                      {draft.prop2Margen !== null && isFinite(draft.prop2Margen) ? `${draft.prop2Margen.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ganancia</span>
                  <div className="mt-0.5">
                    {draft.prop2Ganancia !== null
                      ? <ProfitDisplay value={draft.prop2Ganancia} />
                      : <span className="text-lg font-bold font-mono text-[var(--text-tertiary)]">—</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Ranking</span>
                  <div className="mt-0.5">
                    <RankingBadge ranking={draft.prop2Ranking} total={totalCompetidores} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-t border-[var(--border-primary)] bg-[var(--surface-elevated)]">
      <button
        onClick={onConfirmAdd}
        className="btn btn-primary w-full flex items-center justify-center gap-2"
      >
        {isExisting ? (
          <>
            <TrendingUp className="w-4 h-4" />
            Actualizar Informe
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Agregar al Informe
          </>
        )}
      </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default MarginSlideOver;