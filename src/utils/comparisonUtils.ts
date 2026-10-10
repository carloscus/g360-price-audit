/**
 * @file comparisonUtils.ts
 * @description Utilidades para cálculos de comparación de precios
 * 
 * MANTENIMIENTO:
 * - La fórmula canónica vive en priceCalculations.ts (calculateDsctoRequerido)
 * - Fórmula unificada con el prototipo XLSX "Prisma Comercial" (Dscto Requerido):
 *   dscto = 1 - (precioCompetidor / precioPropio) → positivo = hay que descontar
 * - Los campos 'mX_ratio' conservan su nombre por compatibilidad; su valor es
 *   ahora el dscto requerido como fracción (0.158 = 15.8%)
 * 
 * @author Carlos Cusi
 * @date 2026-03-03
 */

import type { IProductoEditado } from '../interfaces';
import { calculateDsctoRequerido } from './priceCalculations';

export function calculateDataWithPercentages(
  lista: IProductoEditado[],
  competidores: string[]
): (IProductoEditado & Record<string, string | number | undefined>)[] {
  return lista.map(producto => {
    const precios = producto.precios || {};
    const p1 = precios[competidores[0]] ?? 0;
    const porcentajes: { [key: string]: string | number | undefined } = {};

    // Identificar el mejor precio (el más bajo > 0)
    let mejorPrecio = Infinity;
    let mejorCompetidor = '';

    competidores.forEach(comp => {
      const precio = precios[comp] ?? 0;
      if (precio > 0 && precio < mejorPrecio) {
        mejorPrecio = precio;
        mejorCompetidor = comp;
      }
    });

    if (mejorPrecio !== Infinity) {
      porcentajes['mejor_precio_competidor'] = mejorCompetidor;
    }

    if (p1 > 0) {
      // Calcular porcentajes contra competidores
      for (let i = 1; i < competidores.length; i++) {
        const competidorActual = competidores[i];
        const pi = precios[competidorActual] ?? 0;
        if (pi > 0) {
          // Fórmula canónica: dscto requerido = 1 - (precioCompetidor / precioPropio)
          const dscto = calculateDsctoRequerido(p1, pi);
          porcentajes[`% vs ${competidorActual}`] = `${(dscto * 100).toFixed(2)}%`;

          // Fracción para export/compatibilidad (0.158 = 15.8%)
          porcentajes[`m${i + 1}_ratio`] = dscto;
        } else {
          porcentajes[`% vs ${competidorActual}`] = 'N/A';
          porcentajes[`m${i + 1}_ratio`] = undefined;
        }
      }

    } else {
      // Si no hay precio base, todos los cálculos son N/A
      for (let i = 1; i < competidores.length; i++) {
        porcentajes[`% vs ${competidores[i]}`] = 'N/A';
        porcentajes[`m${i + 1}_ratio`] = undefined;
      }
    }

    // Calcular Precio Promedio - solo de los precios de competidores
    // IMPORTANTE: Solo incluir los precios de los competidores, no otros campos
    const preciosCompetidores = competidores
      .map(comp => precios[comp])
      .filter((p): p is number => typeof p === 'number' && p > 0);
    
    const precioPromedio = preciosCompetidores.length > 0
      ? preciosCompetidores.reduce((a, b) => a + b, 0) / preciosCompetidores.length
      : 0;

    return {
      ...producto,
      ...porcentajes,
      precio_promedio: precioPromedio
    } as (IProductoEditado & Record<string, string | number | undefined>);
  });
}
