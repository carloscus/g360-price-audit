import type { IProducto, IProductoEditado } from '../interfaces';

interface BulkImportRow {
  sku?: string | number;
  SKU?: string | number;
  PRECIO_TIENDA?: number | null;
  [key: string]: unknown;
}

/**
 * Procesa filas de importación masiva desde Excel y las fusiona con la lista existente.
 * Lógica extraída de useAppStore para testabilidad y reutilización.
 */
export function processBulkImport(
  rows: BulkImportRow[],
  catalogo: IProducto[],
  currentList: IProductoEditado[],
  marca1: string,
): IProductoEditado[] {
  const result = [...currentList];
  const marca1Key = marca1.trim().toLowerCase();

  rows.forEach((row) => {
    const sku = String(row.sku || row.SKU || '');
    const product = catalogo.find((p) => p.codigo === sku);
    if (!product) return;

    const existingIdx = result.findIndex((p) => p.codigo === product.codigo);

    const preciosNuevos: Record<string, number> = {};

    Object.entries(row).forEach(([key, val]) => {
      if (key.startsWith('PRECIO_') && val !== null && val !== undefined) {
        const brandName = key.replace('PRECIO_', '').replace(/_/g, ' ').toLowerCase().trim();
        preciosNuevos[brandName] = Number(val);
      }
    });

    if (marca1Key && row.PRECIO_TIENDA !== null && row.PRECIO_TIENDA !== undefined) {
      preciosNuevos[marca1Key] = Number(row.PRECIO_TIENDA);
    }

    const preciosExistentes = existingIdx > -1 ? result[existingIdx].precios || {} : {};
    const productoEditado: IProductoEditado = {
      ...(existingIdx > -1
        ? result[existingIdx]
        : { ...product, cantidad: 1, observaciones: '', precios: {} }),
      precios: { ...preciosExistentes, ...preciosNuevos },
    };

    if (existingIdx > -1) {
      result[existingIdx] = productoEditado;
    } else {
      result.push(productoEditado);
    }
  });

  return result;
}
