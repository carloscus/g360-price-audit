import { useState, useCallback, useMemo } from 'react';
import { useMarginStore, type MarginProduct } from '../store/useMarginStore';
import type { ComparisonTableRow } from '../interfaces';
import { useToast } from '../contexts/ToastContext';
import { calculateDerivedMarginData } from '../utils/calculationUtils';
import { DEFAULT_MY_BRAND } from '../utils/config';

interface SlideOverDraft {
  codigo: string;
  ean_14: string;
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
}

type CampoDraft = 'costo' | 'precioTienda' | 'prop1Precio' | 'prop2Costo' | 'prop2Precio' | 'prop2CantidadMinima';

const recalcularDraft = (draft: SlideOverDraft): SlideOverDraft => {
  // Use the centralized calculation function
  const { margenActual, gananciaActual, rankingActual, prop1Margen, prop1Ganancia, prop1Ranking, prop2Margen, prop2Ganancia, prop2DifCosto, prop2DifCostoPct, prop2Ranking } =
    calculateDerivedMarginData(draft.costo, draft.precioTienda, draft.preciosCompetencia, draft.prop1Precio, draft.prop2Costo, draft.prop2Precio);

  return {
    ...draft,
    margenActual, gananciaActual, rankingActual,
    prop1Margen, prop1Ganancia, prop1Ranking,
    prop2Margen, prop2Ganancia, prop2DifCosto, prop2DifCostoPct, prop2Ranking,
  };
};

export function useMarginSlideOver() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<SlideOverDraft | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const { agregarProductoConCosto, actualizarOAgregar, productos } = useMarginStore();
  const { addToast } = useToast();

  const competidores = useMemo(() => {
    if (!draft) return [];
    return Object.keys(draft.preciosCompetencia);
  }, [draft]);

  const openSlideOver = useCallback((item: ComparisonTableRow, competidoresList: string[]) => {
    const miMarca = competidoresList[0] || DEFAULT_MY_BRAND;
    const precioTienda = item.precios?.[miMarca] ?? null;
    const preciosComp: Record<string, number | null> = {};
    competidoresList.forEach(brand => {
      if (brand !== miMarca) {
        preciosComp[brand] = item.precios?.[brand] ?? null;
      }
    });

    const existing = productos.find(p => p.codigo === item.codigo);

    const mergedPreciosComp: Record<string, number | null> = { ...preciosComp };
    if (existing) {
      Object.keys(existing.preciosCompetencia).forEach(brand => {
        if (!(brand in mergedPreciosComp)) {
          mergedPreciosComp[brand] = existing.preciosCompetencia[brand];
        }
      });
    }

    const initialDraft: SlideOverDraft = {
      codigo: item.codigo,
      ean_14: item.ean_14 || '',
      nombre: item.nombre,
      linea: (item as Record<string, unknown>).linea as string ?? '',
      costo: existing?.costo ?? null,
      precioTienda: existing?.precioTienda ?? precioTienda,
      preciosCompetencia: mergedPreciosComp,
      margenActual: null,
      gananciaActual: null,
      rankingActual: null,
      prop1Precio: existing?.prop1Precio ?? precioTienda,
      prop1Margen: null,
      prop1Ganancia: null,
      prop1Ranking: null,
      prop2Costo: existing?.prop2Costo ?? null,
      prop2Precio: existing?.prop2Precio ?? null,
      prop2CantidadMinima: existing?.prop2CantidadMinima ?? null,
      prop2Margen: null,
      prop2Ganancia: null,
      prop2DifCosto: null,
      prop2DifCostoPct: null,
      prop2Ranking: null,
    };

    setIsExisting(!!existing);
    setDraft(recalcularDraft(initialDraft));
    setIsOpen(true);
  }, [productos]);

  const closeSlideOver = useCallback(() => {
    setIsOpen(false);
    setDraft(null);
  }, []);

  const updateDraft = useCallback((campo: CampoDraft, valor: number | null) => {
    setDraft(prev => {
      if (!prev) return prev;
      return recalcularDraft({ ...prev, [campo]: valor });
    });
  }, []);

  const refreshFromTable = useCallback((item: ComparisonTableRow, competidoresList: string[]) => {
    setDraft(prev => {
      if (!prev) return prev;
      const miMarca = competidoresList[0] || DEFAULT_MY_BRAND;
      const nuevosPreciosComp: Record<string, number | null> = {};
      competidoresList.forEach(brand => {
        if (brand !== miMarca) {
          nuevosPreciosComp[brand] = item.precios?.[brand] ?? null;
        }
      });
      const currentPT = item.precios?.[miMarca] ?? prev.precioTienda;
      return recalcularDraft({
        ...prev,
        nombre: item.nombre,
        linea: (item as Record<string, unknown>).linea as string ?? prev.linea,
        precioTienda: prev.precioTienda ?? currentPT,
        preciosCompetencia: nuevosPreciosComp,
      });
    });
  }, []);

  const confirmAddToStore = useCallback(() => {
    if (!draft) return;
    actualizarOAgregar(
      {
        codigo: draft.codigo,
        nombre: draft.nombre,
        ean_14: draft.ean_14,
        peso: 0,
        stock_referencial: 0,
        linea: draft.linea,
        keywords: [],
      },
      draft.costo,
      draft.precioTienda,
      draft.preciosCompetencia,
      draft.prop1Precio,
      draft.prop2Costo,
      draft.prop2Precio,
      draft.prop2CantidadMinima,
    );
    addToast(
      isExisting
        ? `"${draft.nombre}" actualizado en el informe`
        : `"${draft.nombre}" agregado al informe`,
      'success',
    );
    closeSlideOver();
  }, [draft, isExisting, actualizarOAgregar, addToast, closeSlideOver]);

  const cheapestCompetitor = useMemo(() => {
    if (!draft) return null;
    let cheapest: { brand: string; price: number } | null = null;
    Object.entries(draft.preciosCompetencia).forEach(([brand, price]) => {
      if (price !== null && price !== undefined && (cheapest === null || price < cheapest.price)) {
        cheapest = { brand, price };
      }
    });
    return cheapest;
  }, [draft]);

  return {
    isOpen,
    draft,
    isExisting,
    competidores,
    cheapestCompetitor,
    openSlideOver,
    closeSlideOver,
    updateDraft,
    refreshFromTable,
    confirmAddToStore,
  };
}
