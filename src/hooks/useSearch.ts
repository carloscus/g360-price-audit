
// --------------------------------------------------------------------------- #
//                                                                             #
//                         src/hooks/useSearch.ts                              #
//                                                                             #
// MANTENIMIENTO:
// - Este hook usa useMemo para optimización de rendimiento
// - El orden de prioridad de búsqueda es: código > EAN > keywords > nombre
// - Si se necesita cambiar la prioridad, modificar el orden en el filter
// - La búsqueda es case-insensitive
//
// @author Carlos Cusi
// @date 2026-03-03
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import { useMemo } from 'react';
import type { IProducto } from '../interfaces';

/**
 * @hook useSearch
 * @description Un hook personalizado de React para filtrar una lista de productos 
 *              basado en un término de búsqueda, con una lógica de priorización.
 * 
 * @param {IProducto[]} items - El array de productos a filtrar.
 * @param {string} searchTerm - El término de búsqueda introducido por el usuario.
 * @returns {IProducto[]} - Un array de productos que coinciden con el término de búsqueda.
 */
export const useSearch = (items: IProducto[] = [], searchTerm: string): IProducto[] => {
  // `useMemo` es un hook de React que memoriza el resultado de una función.
  // Esto significa que la lógica de filtrado solo se volverá a ejecutar si
  // `items` o `searchTerm` cambian, optimizando el rendimiento al evitar
  // recálculos innecesarios en cada renderizado.
  const filteredItems = useMemo(() => {
    // Si no hay término de búsqueda, se devuelve una lista vacía para no mostrar nada.
    if (!searchTerm.trim()) {
      return [];
    }

    // Se convierte el término de búsqueda a minúsculas para una comparación insensible a mayúsculas.
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    // Se filtra la lista de productos.
    return items.filter(item => {
      // Prioridad 1: Coincidencia exacta con el `codigo` del producto.
      // Esto es útil para búsquedas rápidas y precisas.
      if (item.codigo.toLowerCase() === lowercasedSearchTerm) {
        return true;
      }

      // Prioridad 2: Coincidencia exacta con el `cod_ean` (código de barras).
      if (item.cod_ean.toLowerCase() === lowercasedSearchTerm) {
        return true;
      }

      // Prioridad 3: El `keywords` del producto incluye el término de búsqueda.
      // Esto permite búsquedas más flexibles y parciales.
      if (item.keywords && item.keywords.some(keyword => keyword.toLowerCase().startsWith(lowercasedSearchTerm))) {
        return true;
      }

      // Prioridad 4: El `nombre` del producto incluye el término de búsqueda.
      // Esto permite búsquedas más flexibles y parciales.
      if (item.nombre.toLowerCase().includes(lowercasedSearchTerm)) {
        return true;
      }
      
      // Si no hay coincidencias en los campos priorizados, el producto no se incluye.
      return false;
    });
  }, [items, searchTerm]); // El array de dependencias de useMemo.

  return filteredItems;
};
