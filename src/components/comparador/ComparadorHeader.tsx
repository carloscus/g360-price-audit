import React from 'react';
import { useMarginStore } from '../../store/useMarginStore';

/**
 * Encabezado de la página Comparador: título, descripción y contador
 * de SKUs con simulación de márgenes.
 */
export const ComparadorHeader: React.FC = () => {
  const marginProductos = useMarginStore((state) => state.productos);

  return (
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
  );
};
